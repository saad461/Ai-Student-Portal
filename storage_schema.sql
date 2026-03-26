-- 1. Create Buckets
-- These buckets are required for the Admin Panel uploads to work.
-- 'public: true' allows students to view/download via direct link.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('curriculum-videos', 'curriculum-videos', true, 524288000, null), -- 500MB for videos
  ('curriculum-images', 'curriculum-images', true, 5242880, array['image/*']), -- 5MB for images
  ('library-resources', 'library-resources', true, 52428800, null) -- 50MB for books/resources
on conflict (id) do nothing;

-- 2. Enable RLS on storage.objects
alter table storage.objects enable row level security;

-- 3. Public Read Policies
create policy "Public Read Curriculum Videos"
  on storage.objects for select
  using ( bucket_id = 'curriculum-videos' );

create policy "Public Read Curriculum Images"
  on storage.objects for select
  using ( bucket_id = 'curriculum-images' );

create policy "Public Read Library Resources"
  on storage.objects for select
  using ( bucket_id = 'library-resources' );

-- 4. Admin Write Policies (Assuming 'admin' role in profiles)
-- Note: Replace with proper check based on your auth structure.
-- For this setup, we use the service role key in actions, but these policies
-- provide extra security for direct client uploads if ever implemented.

create policy "Admin Upload Curriculum Videos"
  on storage.objects for insert
  with check (
    bucket_id = 'curriculum-videos'
    and (select role from public.profiles where id = auth.uid()) = 'admin'
  );

create policy "Admin Upload Curriculum Images"
  on storage.objects for insert
  with check (
    bucket_id = 'curriculum-images'
    and (select role from public.profiles where id = auth.uid()) = 'admin'
  );

create policy "Admin Upload Library Resources"
  on storage.objects for insert
  with check (
    bucket_id = 'library-resources'
    and (select role from public.profiles where id = auth.uid()) = 'admin'
  );

-- 5. Admin Delete Policies
create policy "Admin Delete Curriculum Videos"
  on storage.objects for delete
  using (
    bucket_id = 'curriculum-videos'
    and (select role from public.profiles where id = auth.uid()) = 'admin'
  );

create policy "Admin Delete Curriculum Images"
  on storage.objects for delete
  using (
    bucket_id = 'curriculum-images'
    and (select role from public.profiles where id = auth.uid()) = 'admin'
  );

create policy "Admin Delete Library Resources"
  on storage.objects for delete
  using (
    bucket_id = 'library-resources'
    and (select role from public.profiles where id = auth.uid()) = 'admin'
  );
