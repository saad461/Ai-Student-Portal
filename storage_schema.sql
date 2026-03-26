-- BUCKET INITIALIZATION
-- Run these commands to prepare your Supabase storage for uploads.
-- Note: If you get "must be owner of table objects", please create these
-- buckets MANUALLY in your Supabase Dashboard under 'Storage'.

-- 1. Create Buckets
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('curriculum-videos', 'curriculum-videos', true),
  ('curriculum-images', 'curriculum-images', true),
  ('library-resources', 'library-resources', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage Policies (Public Access)
-- If policies already exist, you might need to drop them first or
-- manage them via the Supabase Dashboard UI.

CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (true);

-- 3. Admin Upload Policies (Based on profile role)
CREATE POLICY "Admin Upload" ON storage.objects FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admin Delete" ON storage.objects FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);
