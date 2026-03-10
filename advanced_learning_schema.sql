-- Advanced Learning System Schema Extensions

-- 1. Resources table: Books, Cheat Sheets, Roadmaps, etc.
create table if not exists resources (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  type text not null check (type in ('book', 'cheat_sheet', 'roadmap', 'note', 'case_study')),
  content text, -- Markdown/HTML content for notes/cheat sheets
  external_url text, -- Link to external PDFs or websites
  thumbnail_url text,
  price_points integer default 0,
  is_published boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. User Resources: Track student purchases
create table if not exists user_resources (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  resource_id uuid references resources(id) on delete cascade not null,
  purchased_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, resource_id)
);

-- 3. Daily Challenges: Logic/Algorithm problems
create table if not exists daily_challenges (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text not null,
  initial_code jsonb, -- { html: '', css: '', js: '' } or { code: '' }
  test_cases jsonb, -- Array of { input: any, expected: any }
  difficulty text check (difficulty in ('easy', 'medium', 'hard')),
  points_reward integer default 50,
  active_date date default current_date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Challenge Submissions
create table if not exists challenge_submissions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  challenge_id uuid references daily_challenges(id) on delete cascade not null,
  submitted_code text not null,
  is_correct boolean default false,
  submitted_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, challenge_id)
);

-- 5. Job Listings Cache
create table if not exists job_listings (
  id uuid default uuid_generate_v4() primary key,
  external_id text unique,
  title text not null,
  company text not null,
  location text,
  type text, -- Full-time, Remote, etc.
  description text,
  url text,
  required_skills text[],
  min_level integer default 1,
  salary_range text,
  posted_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. AI Grading Updates for Submissions
alter table submissions add column if not exists ai_score integer;
alter table submissions add column if not exists ai_feedback text;
alter table submissions add column if not exists ai_status text check (ai_status in ('pending', 'passed', 'failed'));

-- RLS Policies for new tables
alter table resources enable row level security;
alter table user_resources enable row level security;
alter table daily_challenges enable row level security;
alter table challenge_submissions enable row level security;
alter table job_listings enable row level security;

-- Resources: Viewable by anyone if published
create policy "Resources are viewable by everyone" on resources for select using (is_published = true);

-- User Resources: Users view their own
create policy "Users can view their own resource purchases" on user_resources for select using (auth.uid() = user_id);
create policy "Users can insert their own purchases" on user_resources for insert with check (auth.uid() = user_id);

-- Daily Challenges: Viewable by anyone
create policy "Daily challenges are viewable by everyone" on daily_challenges for select using (true);

-- Challenge Submissions: Users view/insert their own
create policy "Users can view their own challenge submissions" on challenge_submissions for select using (auth.uid() = user_id);
create policy "Users can insert their own challenge submissions" on challenge_submissions for insert with check (auth.uid() = user_id);

-- Job Listings: Viewable by everyone
create policy "Job listings are viewable by everyone" on job_listings for select using (true);

-- Admin full access
create policy "Admins can manage resources" on resources for all using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
create policy "Admins can manage user_resources" on user_resources for all using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
create policy "Admins can manage daily_challenges" on daily_challenges for all using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
create policy "Admins can manage job_listings" on job_listings for all using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
