-- Add knowledge_check_question to curriculum table
ALTER TABLE curriculum ADD COLUMN IF NOT EXISTS knowledge_check_question text;
