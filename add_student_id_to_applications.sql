-- Add student_id to applications table to link approved students to their profiles
ALTER TABLE IF EXISTS applications
ADD COLUMN IF NOT EXISTS student_id uuid REFERENCES profiles(id) ON DELETE SET NULL;
