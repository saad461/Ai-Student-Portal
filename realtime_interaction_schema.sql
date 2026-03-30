-- ====================================================================
-- FINAL REAL-TIME INTERACTION SCHEMA (CHAT & VIDEO)
-- ====================================================================

-- 1. CLEANUP OLD TABLES
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS video_sessions CASCADE;
DROP TABLE IF EXISTS webrtc_signals CASCADE;

-- 2. CREATE CHAT_MESSAGES TABLE
-- Constraints removed to allow a system ID (0000-...) without auth
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CREATE VIDEO_SESSIONS TABLE
CREATE TABLE IF NOT EXISTS video_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL,
  admin_id UUID,
  scheduled_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ,
  status TEXT DEFAULT 'requested' CHECK (status IN ('requested', 'approved', 'rejected', 'completed', 'missed')),
  is_ringing BOOLEAN DEFAULT false,
  room_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CREATE WEBRTC_SIGNALS TABLE (CUSTOM SIGNALING)
CREATE TABLE IF NOT EXISTS webrtc_signals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES video_sessions(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID NOT NULL,
  type TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ENABLE ROW LEVEL SECURITY
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE webrtc_signals ENABLE ROW LEVEL SECURITY;

-- 6. RLS POLICIES FOR CHAT_MESSAGES
-- Students can see their own messages
CREATE POLICY "Users can view their own messages" ON chat_messages FOR SELECT USING (
  auth.uid() = sender_id OR auth.uid() = receiver_id
);

-- Students can insert their own messages
CREATE POLICY "Students can insert messages" ON chat_messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id
);

-- 7. RLS POLICIES FOR VIDEO_SESSIONS
CREATE POLICY "Users can view their own video sessions" ON video_sessions FOR SELECT USING (
  auth.uid() = student_id OR auth.uid() = admin_id
);

CREATE POLICY "Students can request video sessions" ON video_sessions FOR INSERT WITH CHECK (
  auth.uid() = student_id
);

-- 8. PROFILES ENHANCEMENT
-- This is still needed for role tracking, but we reset everyone to 'student'
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student';

-- Reset any lingering admin roles back to student
UPDATE profiles SET role = 'student' WHERE role = 'admin';

-- NOTE: NO fake IDs inserted into profiles here to avoid 23503 errors.
