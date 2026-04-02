-- Migration to link applications and student profiles
ALTER TABLE applications ADD COLUMN IF NOT EXISTS student_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
