-- Cleanup old messages table if it exists and is only for assignments
-- (Based on user confirmation that it's no longer needed)
DROP TABLE IF EXISTS messages;

-- 1-on-1 Chat Messages Table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Video Sessions Table
CREATE TABLE IF NOT EXISTS video_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ, -- For the 1-hour window (e.g., 7pm to 8pm)
  status TEXT DEFAULT 'requested' CHECK (status IN ('requested', 'approved', 'rejected', 'completed', 'missed')),
  is_ringing BOOLEAN DEFAULT false,
  room_id TEXT, -- For WebRTC signaling room
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- WebRTC Signaling Table (Custom Signaling)
CREATE TABLE IF NOT EXISTS webrtc_signals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES video_sessions(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) NOT NULL,
  type TEXT NOT NULL, -- 'offer', 'answer', 'ice-candidate'
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE webrtc_signals ENABLE ROW LEVEL SECURITY;

-- Chat Messages Policies
CREATE POLICY "Users can view their own messages"
ON chat_messages FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can insert their own messages"
ON chat_messages FOR INSERT
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their own received messages (for marking as read)"
ON chat_messages FOR UPDATE
USING (auth.uid() = receiver_id);

-- Video Sessions Policies
CREATE POLICY "Users can view their own video sessions"
ON video_sessions FOR SELECT
USING (auth.uid() = student_id OR auth.uid() = admin_id);

CREATE POLICY "Students can request video sessions"
ON video_sessions FOR INSERT
WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Admins can update video sessions"
ON video_sessions FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- WebRTC Signals Policies
CREATE POLICY "Users can view signals for their sessions"
ON webrtc_signals FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM video_sessions
    WHERE video_sessions.id = webrtc_signals.session_id
    AND (video_sessions.student_id = auth.uid() OR video_sessions.admin_id = auth.uid())
  )
);

CREATE POLICY "Users can insert signals for their sessions"
ON webrtc_signals FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM video_sessions
    WHERE video_sessions.id = session_id
    AND (video_sessions.student_id = auth.uid() OR video_sessions.admin_id = auth.uid())
  )
);

-- Ensure profiles table has role
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student';
