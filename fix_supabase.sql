-- 1. Fix the curriculum table constraints to allow all weekdays
ALTER TABLE curriculum DROP CONSTRAINT IF EXISTS curriculum_day_check;
ALTER TABLE curriculum ADD CONSTRAINT curriculum_day_check
  CHECK (day IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Monthly', 'Final'));

-- 2. Create a function to check if the current user is an admin without causing recursion
-- This function is 'security definer' so it runs with the privileges of the creator (bypass RLS)
CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT (role = 'admin')
    FROM public.profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Update RLS policies to use the new function
-- Drop old policies first
DROP POLICY IF EXISTS "Admins can do everything" ON profiles;
DROP POLICY IF EXISTS "Admins can manage curriculum" ON curriculum;
DROP POLICY IF EXISTS "Admins can view/edit all submissions" ON submissions;
DROP POLICY IF EXISTS "Admins can view all attendance" ON attendance;
DROP POLICY IF EXISTS "Admins can manage all messages" ON messages;
DROP POLICY IF EXISTS "Admins can manage all extra tasks" ON extra_tasks;
DROP POLICY IF EXISTS "Admins can view all focus sessions" ON focus_sessions;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Re-create policies using the non-recursive function
CREATE POLICY "Admins can do everything" ON profiles FOR ALL USING (check_is_admin());
CREATE POLICY "Admins can manage curriculum" ON curriculum FOR ALL USING (check_is_admin());
CREATE POLICY "Admins can view/edit all submissions" ON submissions FOR ALL USING (check_is_admin());
CREATE POLICY "Admins can view all attendance" ON attendance FOR ALL USING (check_is_admin());
CREATE POLICY "Admins can manage all messages" ON messages FOR ALL USING (check_is_admin());
CREATE POLICY "Admins can manage all extra tasks" ON extra_tasks FOR ALL USING (check_is_admin());
CREATE POLICY "Admins can view all focus sessions" ON focus_sessions FOR SELECT USING (check_is_admin());
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (check_is_admin());
