-- Update submissions table for structured AI feedback and scores
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS ai_sections JSONB;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS ai_mistakes TEXT[];
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS ai_improvements TEXT[];

-- Ensure ai_score and ai_feedback exist (they already do from complete_schema.sql)
-- But we can add a check for the new columns
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='submissions' AND column_name='ai_sections') THEN
        ALTER TABLE submissions ADD COLUMN ai_sections JSONB;
    END IF;
END $$;
