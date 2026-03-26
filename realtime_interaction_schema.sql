-- ==========================================
-- REAL-TIME INTERACTION SCHEMA (CHAT & VIDEO)
-- ==========================================

-- 1. CLEANUP OLD MESSAGES (DESTRUCTIVE)
-- This removes the old messages table and its foreign key dependencies (like extra_tasks)
DROP TABLE IF EXISTS messages CASCADE;

-- 2. CREATE CHAT_MESSAGES TABLE
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CREATE VIDEO_SESSIONS TABLE
CREATE TABLE IF NOT EXISTS video_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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
  sender_id UUID REFERENCES auth.users(id) NOT NULL,
  type TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ENABLE ROW LEVEL SECURITY
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE webrtc_signals ENABLE ROW LEVEL SECURITY;

-- 6. RLS POLICIES FOR CHAT_MESSAGES
DROP POLICY IF EXISTS "Users can view their own messages" ON chat_messages;
CREATE POLICY "Users can view their own messages" ON chat_messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users can insert their own messages" ON chat_messages;
CREATE POLICY "Users can insert their own messages" ON chat_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users can update their own received messages" ON chat_messages;
CREATE POLICY "Users can update their own received messages" ON chat_messages FOR UPDATE USING (auth.uid() = receiver_id);

-- 7. RLS POLICIES FOR VIDEO_SESSIONS
DROP POLICY IF EXISTS "Users can view their own video sessions" ON video_sessions;
CREATE POLICY "Users can view their own video sessions" ON video_sessions FOR SELECT USING (auth.uid() = student_id OR auth.uid() = admin_id);

DROP POLICY IF EXISTS "Students can request video sessions" ON video_sessions;
CREATE POLICY "Students can request video sessions" ON video_sessions FOR INSERT WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "Admins can update video sessions" ON video_sessions;
CREATE POLICY "Admins can update video sessions" ON video_sessions FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- 8. RLS POLICIES FOR WEBRTC_SIGNALS
DROP POLICY IF EXISTS "Users can view signals for their sessions" ON webrtc_signals;
CREATE POLICY "Users can view signals for their sessions" ON webrtc_signals FOR SELECT USING (
  EXISTS (SELECT 1 FROM video_sessions WHERE video_sessions.id = webrtc_signals.session_id AND (video_sessions.student_id = auth.uid() OR video_sessions.admin_id = auth.uid()))
);

DROP POLICY IF EXISTS "Users can insert signals for their sessions" ON webrtc_signals;
CREATE POLICY "Users can insert signals for their sessions" ON webrtc_signals FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND EXISTS (SELECT 1 FROM video_sessions WHERE video_sessions.id = session_id AND (video_sessions.student_id = auth.uid() OR video_sessions.admin_id = auth.uid()))
);

-- 9. PROFILES ENHANCEMENT
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student';

-- IMPORTANT: Allow students to "find" an admin to message
DROP POLICY IF EXISTS "Everyone can view admin profiles" ON profiles;
CREATE POLICY "Everyone can view admin profiles" ON profiles FOR SELECT USING (role = 'admin');


-- ====================================================================
-- DEVELOPER NOTE: HOW TO CREATE AN ADMIN
-- ====================================================================
-- 1. Sign up as a user in your student portal
-- 2. Run the query below in Supabase SQL editor to promote yourself:
--
-- UPDATE profiles SET role = 'admin' WHERE id = (SELECT id FROM profiles LIMIT 1);
-- ====================================================================
