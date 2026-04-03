-- Add missing columns to profiles table
alter table profiles add column if not exists email text;
alter table profiles add column if not exists last_seen timestamp with time zone;
alter table profiles add column if not exists current_course_id uuid;
alter table profiles add column if not exists achievements text[];
