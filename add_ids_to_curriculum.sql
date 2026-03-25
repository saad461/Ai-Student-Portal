-- Migration: Add course_id and module_id to curriculum table
ALTER TABLE IF EXISTS curriculum
ADD COLUMN IF NOT EXISTS course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS module_id uuid REFERENCES modules(id) ON DELETE CASCADE;

-- Note: In a production environment, you might want to backfill these IDs
-- based on module_index and course associations if they already exist.
