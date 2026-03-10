-- User Perks Table: Tracks what a student has bought in the Skill Shop
create table if not exists user_perks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  perk_id text not null, -- e.g. 'streak_freeze', 'xp_booster'
  quantity integer default 1,
  used_count integer default 0,
  active_until timestamp with time zone, -- For timed perks like XP boosters
  purchased_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, perk_id)
);

-- RLS Policies
alter table user_perks enable row level security;
create policy "Users can view their own perks" on user_perks for select using (auth.uid() = user_id);
create policy "Users can insert/update their own perks" on user_perks for all using (auth.uid() = user_id);
create policy "Admins can manage all perks" on user_perks for all using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- Update Profile for easier access to active perks
alter table profiles add column if not exists has_streak_freeze boolean default false;
alter table profiles add column if not exists xp_booster_until timestamp with time zone;
