-- ============================================
-- SALES CRM - Supabase Database Schema
-- Run this entire file in Supabase SQL Editor
-- ============================================

-- 1. PROFILES table (extends Supabase auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text not null,
  role text not null check (role in ('manager', 'rep')) default 'rep',
  avatar_url text,
  created_at timestamptz default now()
);

-- 2. KPI TARGETS table (one row per period)
create table if not exists public.kpi_targets (
  id uuid default gen_random_uuid() primary key,
  period text not null unique check (period in ('daily', 'weekly', 'monthly', 'quarterly')),
  businesses_contacted int not null default 0,
  follow_ups int not null default 0,
  meetings_booked int not null default 0,
  demos_done int not null default 0,
  proposals_sent int not null default 0,
  deals_closed int not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. DAILY LOGS table (one row per rep per day)
create table if not exists public.daily_logs (
  id uuid default gen_random_uuid() primary key,
  rep_id uuid references public.profiles(id) on delete cascade not null,
  log_date date not null,
  businesses_contacted int not null default 0,
  follow_ups int not null default 0,
  meetings_booked int not null default 0,
  demos_done int not null default 0,
  proposals_sent int not null default 0,
  deals_closed int not null default 0,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(rep_id, log_date)
);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

alter table public.profiles enable row level security;
alter table public.kpi_targets enable row level security;
alter table public.daily_logs enable row level security;

-- Profiles: users can read all profiles, update only their own
create policy "Profiles are viewable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- KPI Targets: everyone can read, only managers can write
create policy "Targets are viewable by all"
  on public.kpi_targets for select
  to authenticated
  using (true);

create policy "Only managers can insert targets"
  on public.kpi_targets for insert
  to authenticated
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'manager')
  );

create policy "Only managers can update targets"
  on public.kpi_targets for update
  to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'manager')
  );

-- Daily Logs: reps can manage their own, managers can read all
create policy "Reps can view own logs"
  on public.daily_logs for select
  to authenticated
  using (
    rep_id = auth.uid()
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'manager')
  );

create policy "Reps can insert own logs"
  on public.daily_logs for insert
  to authenticated
  with check (rep_id = auth.uid());

create policy "Reps can update own logs"
  on public.daily_logs for update
  to authenticated
  using (rep_id = auth.uid());

-- ============================================
-- AUTO-CREATE PROFILE ON SIGNUP TRIGGER
-- ============================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'rep')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================
-- SEED: Default KPI targets
-- ============================================

insert into public.kpi_targets (period, businesses_contacted, follow_ups, meetings_booked, demos_done, proposals_sent, deals_closed)
values
  ('daily',     10, 5, 1, 1, 1, 0),
  ('weekly',    50, 25, 5, 3, 3, 1),
  ('monthly',  200, 100, 20, 12, 10, 4),
  ('quarterly', 600, 300, 60, 36, 30, 12)
on conflict (period) do nothing;
