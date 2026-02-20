-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table: Stores user information and progress
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  cv_url text,
  enrollment_date timestamp with time zone default timezone('utc'::text, now()) not null,
  is_pro boolean default false,
  current_streak integer default 0,
  total_points integer default 0,
  role text default 'student' check (role in ('student', 'admin')),
  last_punch_in timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Curriculum table: Stores assignments, tasks, and quizzes
create table curriculum (
  id text primary key,
  week integer not null,
  day text not null check (day in ('Monday', 'Wednesday', 'Friday', 'Monthly', 'Final')),
  type text not null check (type in ('assignment', 'task', 'quiz', 'grand_test', 'final_project')),
  title text not null,
  description text not null,
  content jsonb, -- For quiz questions or detailed task instructions
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Submissions table: Stores student work
create table submissions (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references profiles(id) on delete cascade not null,
  curriculum_id text not null,
  github_url text,
  status text default 'submitted' check (status in ('submitted', 'reviewed', 'extra_task_assigned')),
  feedback text,
  submitted_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(student_id, curriculum_id)
);

-- Attendance table: Daily punch-ins
create table attendance (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references profiles(id) on delete cascade not null,
  date date default current_date not null,
  punched_in_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(student_id, date)
);

-- Messages table: For "Sorry" messages to admin
create table messages (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references profiles(id) on delete cascade not null,
  curriculum_id text, -- The missed assignment
  body text not null,
  status text default 'pending' check (status in ('pending', 'resolved', 'extra_task_assigned')),
  admin_reply text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Extra Tasks table: Assigned as penalty
create table extra_tasks (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references profiles(id) on delete cascade not null,
  message_id uuid references messages(id) on delete cascade,
  description text not null,
  is_completed boolean default false,
  completed_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Focus Sessions table: Stores deep work sessions
create table focus_sessions (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references profiles(id) on delete cascade not null,
  duration_seconds integer not null,
  completed_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Row Level Security (RLS)
alter table profiles enable row level security;
alter table curriculum enable row level security;
alter table submissions enable row level security;
alter table attendance enable row level security;
alter table messages enable row level security;
alter table extra_tasks enable row level security;
alter table focus_sessions enable row level security;

-- Policies
create policy "Public curriculum is viewable by everyone" on curriculum for select using (true);
create policy "Users can view their own profile" on profiles for select using (auth.uid() = id);
create policy "Admins can view all profiles" on profiles for select using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
create policy "Users can view their own submissions" on submissions for select using (auth.uid() = student_id);
create policy "Users can view their own attendance" on attendance for select using (auth.uid() = student_id);
create policy "Users can view their own messages" on messages for select using (auth.uid() = student_id);
create policy "Users can view their own extra tasks" on extra_tasks for select using (auth.uid() = student_id);
create policy "Users can view their own focus sessions" on focus_sessions for select using (auth.uid() = student_id);
create policy "Users can insert their own focus sessions" on focus_sessions for insert with check (auth.uid() = student_id);

-- Admin policies
create policy "Admins can do everything" on profiles for all using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
create policy "Admins can manage curriculum" on curriculum for all using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
create policy "Admins can view/edit all submissions" on submissions for all using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
create policy "Admins can view all attendance" on attendance for all using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
create policy "Admins can manage all messages" on messages for all using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
create policy "Admins can manage all extra tasks" on extra_tasks for all using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
create policy "Admins can view all focus sessions" on focus_sessions for select using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
