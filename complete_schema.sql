-- 1. BASE TABLES & EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. ENHANCED PROFILES
alter table profiles add column if not exists achievements text[] default '{}';
alter table profiles add column if not exists xp_booster_until timestamp with time zone;
alter table profiles add column if not exists has_streak_freeze boolean default false;
alter table profiles add column if not exists current_course_id uuid;

-- 3. COURSES & STRUCTURE
create table if not exists courses (
  id uuid default uuid_generate_v4() primary key,
  slug text unique not null,
  name text not null,
  description text,
  thumbnail_url text,
  index integer not null,
  parent_id uuid references courses(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists user_courses (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  course_id uuid references courses(id) on delete cascade not null,
  status text default 'unlocked' check (status in ('locked', 'unlocked', 'completed')),
  unlocked_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, course_id)
);

-- 4. KNOWLEDGE HUB (RESOURCES)
create table if not exists resources (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  type text not null check (type in ('book', 'cheat_sheet', 'roadmap', 'note', 'case_study')),
  content text,
  external_url text,
  thumbnail_url text,
  file_path text,
  price_points integer default 0,
  is_published boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists user_resources (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  resource_id uuid references resources(id) on delete cascade not null,
  purchased_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, resource_id)
);

-- 5. DAILY CHALLENGES & STREAKS
create table if not exists daily_challenges (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text not null,
  initial_code jsonb,
  test_cases jsonb,
  difficulty text check (difficulty in ('easy', 'medium', 'hard')),
  points_reward integer default 50,
  active_date date default current_date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists challenge_submissions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  challenge_id uuid references daily_challenges(id) on delete cascade not null,
  submitted_code text not null,
  is_correct boolean default false,
  submitted_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, challenge_id)
);

-- 6. REWARD SYSTEM & PERKS
create table if not exists reward_log (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references profiles(id) on delete cascade not null,
  amount integer not null,
  reason text not null,
  source_type text not null, -- 'attendance', 'game', 'challenge', 'daily_bounty'
  source_id text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(student_id, source_type, source_id)
);

create table if not exists user_perks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  perk_id text not null, -- 'streak_freeze', 'xp_booster', 'resume_template'
  quantity integer default 1,
  purchased_at timestamp with time zone default timezone('utc'::text, now()) not null,
  is_active boolean default true
);

-- 7. ACTIVITY & NOTIFICATIONS
create table if not exists student_activity (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references profiles(id) on delete cascade not null,
  activity_type text not null,
  details jsonb,
  page_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists notifications (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references profiles(id) on delete cascade not null,
  title text not null,
  message text not null,
  type text default 'info' check (type in ('info', 'success', 'warning', 'achievement')),
  read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. SUBMISSIONS (AI GRADING)
alter table submissions add column if not exists ai_score integer;
alter table submissions add column if not exists ai_feedback text;
alter table submissions add column if not exists ai_status text check (ai_status in ('pending', 'passed', 'failed'));

-- 9. RPC FUNCTIONS
create or replace function increment_points(user_id uuid, amount int)
returns void language plpgsql security definer as $$
begin
  update profiles set total_points = coalesce(total_points, 0) + amount where id = user_id;
end; $$;

create or replace function update_challenge_streak(p_user_id uuid, p_today date)
returns void language plpgsql security definer as $$
declare
  v_last_sub date;
  v_curr_streak int;
begin
  select current_streak, last_punch_in::date into v_curr_streak, v_last_sub from profiles where id = p_user_id;
  if v_last_sub = p_today then return;
  elsif v_last_sub = (p_today - interval '1 day')::date then
    update profiles set current_streak = coalesce(v_curr_streak, 0) + 1, last_punch_in = now() where id = p_user_id;
  else
    update profiles set current_streak = 1, last_punch_in = now() where id = p_user_id;
  end if;
end; $$;

-- 10. ENABLE RLS
alter table chat_messages enable row level security;
alter table video_sessions enable row level security;
alter table webrtc_signals enable row level security;
alter table reward_log enable row level security;
alter table user_perks enable row level security;
alter table courses enable row level security;
alter table user_courses enable row level security;
alter table resources enable row level security;
alter table user_resources enable row level security;
alter table daily_challenges enable row level security;
alter table challenge_submissions enable row level security;
alter table student_activity enable row level security;
alter table notifications enable row level security;

-- Fix Notifications RLS: Ensure students can see their own notifications
drop policy if exists "Students can view their own notifications" on notifications;
create policy "Students can view their own notifications" on notifications
for select using (auth.uid() = student_id);

drop policy if exists "Students can update their own notifications" on notifications;
create policy "Students can update their own notifications" on notifications
for update using (auth.uid() = student_id);

-- Fix Chat RLS for Anonymous Admin Support
drop policy if exists "Users can view their own messages" on chat_messages;
create policy "Users can view their own messages" on chat_messages
for select using (auth.uid() = sender_id OR auth.uid() = receiver_id);

drop policy if exists "Anyone can insert chat messages" on chat_messages;
create policy "Anyone can insert chat messages" on chat_messages
for insert with check (true);
