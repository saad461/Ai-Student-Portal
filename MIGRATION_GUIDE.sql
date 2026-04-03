-- 1. FIX PROFILES TABLE (Missing columns)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_course_id UUID REFERENCES public.courses(id);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS achievements TEXT[] DEFAULT '{}';

-- 2. CREATE WELLNESS STORIES TABLE
CREATE TABLE IF NOT EXISTS public.wellness_stories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Seed initial wellness stories
INSERT INTO public.wellness_stories (title, body) VALUES
('The Persistent Programmer', 'Ada spent 48 hours debugging a single semicolon. When she finally found it, she didn''t just fix the bug; she optimized the entire algorithm. Persistence is the key to mastery.'),
('The Flow State', 'Focus is not about doing more; it''s about doing one thing with your whole heart. When you lose track of time, you''ve found your flow.'),
('Rest to Recharge', 'A rested mind is 10x more productive than a tired one. Taking 15 minutes to breathe is an investment, not a distraction.')
ON CONFLICT DO NOTHING;

-- 3. ENSURE REWARD LOG UNIQUE CONSTRAINT (For secure point deduction)
-- This ensures students can't be rewarded multiple times for the same action
ALTER TABLE public.reward_log DROP CONSTRAINT IF EXISTS reward_log_student_id_source_type_source_id_key;
ALTER TABLE public.reward_log ADD CONSTRAINT reward_log_student_id_source_type_source_id_key UNIQUE (student_id, source_type, source_id);

-- 4. REFRESH SCHEMA CACHE (Internal Supabase step)
-- Note: Running these in the Supabase SQL Editor automatically refreshes the cache for the API.
