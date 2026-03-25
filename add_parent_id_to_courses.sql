-- Migration: Add parent_id to courses table to support sub-courses
ALTER TABLE IF EXISTS courses
ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES courses(id) ON DELETE SET NULL;
