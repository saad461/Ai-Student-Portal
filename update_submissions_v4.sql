-- Update submissions table for granular instructor feedback
ALTER TABLE IF EXISTS submissions
ADD COLUMN IF NOT EXISTS manual_sections JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS manual_mistakes TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS manual_improvements TEXT[] DEFAULT '{}';
