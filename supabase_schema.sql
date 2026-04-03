-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table: Stores user information and progress
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  email text,
  first_name text,
  last_name text,
  gender text,
  cnic text,
  age integer,
  phone_number text,
  passport_url text,
  skills_level text,
  objective text,
  education text,
  city text,
  github_link text,
  login_pin text,
  course_pin text,
  cv_url text,
  enrollment_date timestamp with time zone default timezone('utc'::text, now()) not null,
  is_pro boolean default false,
  current_streak integer default 0,
  total_points integer default 0,
  role text default 'student' check (role in ('student', 'admin')),
  last_punch_in timestamp with time zone,
  agreed_tc boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Applications table: Stores enrollment requests
create table applications (
  id uuid default uuid_generate_v4() primary key,
  first_name text not null,
  last_name text not null,
  gender text not null,
  cnic text not null,
  email text not null,
  age integer not null,
  phone_number text not null,
  passport_url text,
  skills_level text not null,
  objective text not null,
  education text not null,
  city text not null,
  github_link text,
  course_pin text not null,
  student_id uuid references profiles(id) on delete set null,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Modules table: For top-level course organization
create table modules (
  id uuid default uuid_generate_v4() primary key,
  index integer not null,
  name text not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Sub-modules table: For grouping lectures within modules
create table sub_modules (
  id uuid default uuid_generate_v4() primary key,
  module_id uuid references modules(id) on delete cascade not null,
  index integer not null,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Curriculum table: Stores assignments, tasks, and quizzes
create table curriculum (
  id text primary key,
  module_index integer,
  module_name text,
  lecture_index integer,
  week integer not null,
  day text not null, -- Day label (e.g. "Lecture 1") - Constraint removed to allow custom labels
  type text not null check (type in ('assignment', 'task', 'quiz', 'lecture', 'grand_test', 'final_project')),
  sub_module_id uuid references sub_modules(id) on delete set null,
  sub_module_name text,
  title text not null,
  description text not null,
  requirements text[],
  required_focus_hours numeric default 0,
  required_read_minutes integer default 0,
  content jsonb, -- For quiz questions, task instructions, or custom ToC for lectures
  theory_content text,
  video_url text,
  attached_assignment jsonb,
  attached_quiz jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Submissions table: Stores student work
create table submissions (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references profiles(id) on delete cascade not null,
  curriculum_id text not null,
  github_url text,
  status text default 'submitted' check (status in ('submitted', 'reviewed', 'extra_task_assigned', 'skipped')),
  feedback text,
  completion_data jsonb, -- For tracking lecture sub-tasks completion
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
alter table modules enable row level security;
alter table sub_modules enable row level security;
alter table curriculum enable row level security;
alter table submissions enable row level security;
alter table attendance enable row level security;
alter table messages enable row level security;
alter table extra_tasks enable row level security;
alter table focus_sessions enable row level security;

-- Policies
create policy "Public modules are viewable by everyone" on modules for select using (true);
create policy "Public sub_modules are viewable by everyone" on sub_modules for select using (true);
create policy "Public curriculum is viewable by everyone" on curriculum for select using (true);

-- Applications policies
alter table applications enable row level security;
create policy "Anyone can insert applications" on applications for insert with check (true);
create policy "Admins can view all applications" on applications for select using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
create policy "Admins can update applications" on applications for update using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- Profiles policies
create policy "Users can view their own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update their own profile" on profiles for update using (auth.uid() = id);
create policy "Admins can view all profiles" on profiles for select using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- Submissions policies
create policy "Users can view their own submissions" on submissions for select using (auth.uid() = student_id);
create policy "Users can insert their own submissions" on submissions for insert with check (auth.uid() = student_id);
create policy "Users can update their own submissions" on submissions for update using (auth.uid() = student_id);

-- Attendance policies
create policy "Users can view their own attendance" on attendance for select using (auth.uid() = student_id);
create policy "Users can insert their own attendance" on attendance for insert with check (auth.uid() = student_id);

-- Messages policies
create policy "Users can view their own messages" on messages for select using (auth.uid() = student_id);
create policy "Users can insert their own messages" on messages for insert with check (auth.uid() = student_id);

-- Extra Tasks policies
create policy "Users can view their own extra tasks" on extra_tasks for select using (auth.uid() = student_id);
create policy "Users can insert their own extra tasks" on extra_tasks for insert with check (auth.uid() = student_id);
create policy "Users can update their own extra tasks" on extra_tasks for update using (auth.uid() = student_id);

-- Focus Sessions policies
create policy "Users can view their own focus sessions" on focus_sessions for select using (auth.uid() = student_id);
create policy "Users can insert their own focus sessions" on focus_sessions for insert with check (auth.uid() = student_id);

-- Admin policies
create policy "Admins can do everything" on profiles for all using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
create policy "Admins can manage modules" on modules for all using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
create policy "Admins can manage sub_modules" on sub_modules for all using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
create policy "Admins can manage curriculum" on curriculum for all using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
create policy "Admins can view/edit all submissions" on submissions for all using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
create policy "Admins can view all attendance" on attendance for all using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
create policy "Admins can manage all messages" on messages for all using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
create policy "Admins can manage all extra tasks" on extra_tasks for all using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
create policy "Admins can view all focus sessions" on focus_sessions for select using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- Storage Buckets
-- Note: These usually need to be created via the Supabase Dashboard or API
-- insert into storage.buckets (id, name, public) values ('passports', 'passports', true);
-- insert into storage.buckets (id, name, public) values ('cvs', 'cvs', true);
-- insert into storage.buckets (id, name, public) values ('curriculum-images', 'curriculum-images', true);
-- insert into storage.buckets (id, name, public) values ('curriculum-videos', 'curriculum-videos', true);

-- Storage Policies for Passports
-- create policy "Passport images are publicly accessible" on storage.objects for select using (bucket_id = 'passports');
-- create policy "Anyone can upload a passport image" on storage.objects for insert with check (bucket_id = 'passports');
