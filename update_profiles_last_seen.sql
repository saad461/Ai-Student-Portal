-- Update profiles table to include last_seen for online status tracking
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ DEFAULT NOW();

-- Ensure RLS allows users to update their own last_seen
-- Usually profiles already has a policy for users to update their own record.
-- Let's check or add a specific one if needed.
-- In most cases, a generic "Users can update own profile" exists.
