-- Update curriculum table for multiple knowledge checks
ALTER TABLE curriculum DROP COLUMN IF EXISTS knowledge_check_question;
ALTER TABLE curriculum ADD COLUMN IF NOT EXISTS knowledge_checks jsonb DEFAULT '[]'::jsonb;
