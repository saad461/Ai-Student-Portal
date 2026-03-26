-- ====================================================================
-- FINAL REAL-TIME INTERACTION SCHEMA (CHAT & VIDEO)
-- ====================================================================

-- 1. CLEANUP OLD MESSAGES (RESOLVES DEPENDENCY ERRORS)
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS video_sessions CASCADE;
DROP TABLE IF EXISTS webrtc_signals CASCADE;

-- 2. CREATE CHAT_MESSAGES TABLE
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL, -- Removed FK to auth.users to allow System Admin without Auth
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
-- We allow students to see messages where they are sender or receiver
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
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student';

-- Ensure all REAL students are set to 'student' role
UPDATE profiles SET role = 'student' WHERE role = 'admin';

-- Create a DEDICATED System Support profile (Fixed UUID)
-- This ID doesn't need to exist in auth.users because we removed the FK in chat_messages
INSERT INTO profiles (id, full_name, role)
VALUES ('00000000-0000-0000-0000-000000000000', 'System Support', 'admin')
ON CONFLICT (id) DO UPDATE SET role = 'admin', full_name = 'System Support';

-- Allow everyone to see this admin profile
DROP POLICY IF EXISTS "Everyone can view admin profiles" ON profiles;
CREATE POLICY "Everyone can view admin profiles" ON profiles FOR SELECT USING (role = 'admin');

-- 9. SERVICE ROLE BYPASS
-- Note: Service role (Admin Dashboard) bypasses RLS automatically.
