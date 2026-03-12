-- Activity Log table: Tracks student behavior
create table if not exists student_activity (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references profiles(id) on delete cascade not null,
  activity_type text not null, -- 'login', 'tab_switch', 'page_view', 'assignment_start'
  details jsonb,
  page_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Notifications table: For student alerts
create table if not exists notifications (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references profiles(id) on delete cascade not null,
  title text not null,
  message text not null,
  type text default 'info' check (type in ('info', 'success', 'warning', 'achievement')),
  read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table student_activity enable row level security;
alter table notifications enable row level security;

-- Policies
create policy "Users can view their own notifications" on notifications for select using (auth.uid() = student_id);
create policy "Users can update their own notifications" on notifications for update using (auth.uid() = student_id);
create policy "Users can delete their own notifications" on notifications for delete using (auth.uid() = student_id);

create policy "Admins can view all activity" on student_activity for select using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
create policy "Students can insert their own activity" on student_activity for insert with check (auth.uid() = student_id);
create policy "Admins can manage notifications" on notifications for all using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- Add achievements to profiles if not exists
alter table profiles add column if not exists achievements text[] default '{}';

-- RPC for atomic point increments
create or replace function increment_points(user_id uuid, amount int)
returns void
language plpgsql
security definer
as $$
begin
  update profiles
  set total_points = coalesce(total_points, 0) + amount
  where id = user_id;
end;
$$;
