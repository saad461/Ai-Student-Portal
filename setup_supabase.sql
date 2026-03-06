-- SQL for Supabase Setup to support Advanced Rich Text CMS

-- 1. Ensure Storage Buckets exist and are public
-- These buckets are used for media uploads from the Rich Text Editor
insert into storage.buckets (id, name, public)
values ('curriculum-images', 'curriculum-images', true)
on conflict (id) do update set public = true;

insert into storage.buckets (id, name, public)
values ('curriculum-videos', 'curriculum-videos', true)
on conflict (id) do update set public = true;

-- 2. Storage Policies
-- Allow anyone to read images/videos
create policy "Images are publicly accessible" on storage.objects for select using (bucket_id = 'curriculum-images');
create policy "Videos are publicly accessible" on storage.objects for select using (bucket_id = 'curriculum-videos');

-- Allow admins to upload (requires RLS to be configured on profiles table)
-- If you haven't set up 'check_is_admin()', you might need to adjust these.
create policy "Admins can upload images" on storage.objects for insert
with check (bucket_id = 'curriculum-images');

create policy "Admins can upload videos" on storage.objects for insert
with check (bucket_id = 'curriculum-videos');

-- 3. Ensure Curriculum table has necessary columns
-- Most of these should already exist if you used the provided schema, but here's a safety check.
alter table curriculum add column if not exists theory_content text;
alter table curriculum add column if not exists video_url text;
alter table curriculum add column if not exists required_read_minutes integer default 0;
alter table curriculum add column if not exists required_focus_hours numeric default 0;

-- 4. ToC and JSON content support
-- The 'content' column is used for the custom Table of Contents array.
alter table curriculum add column if not exists content jsonb;
