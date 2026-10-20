-- Remote personal backup schema for Pausa.
-- Apply this migration to the Supabase project used by the app.
-- RLS restricts every row to the authenticated account. No delete policies in the MVP.

create table public.user_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  settings jsonb not null
);

create table public.smoking_events (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  event_type text not null check (event_type in ('paused', 'smoked')),
  trigger_emotion text,
  outcome text check (outcome in ('resisted', 'ceded')),
  notes text,
  duration_seconds integer,
  inventory_decremented boolean,
  occurred_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table public.inventory_logs (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  movement_type text not null check (movement_type in ('purchase', 'consumption')),
  quantity integer not null check (quantity > 0),
  packs_bought integer,
  cost numeric,
  occurred_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table public.user_achievements (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  achievement_code text not null,
  unlocked_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (user_id, achievement_code)
);

create index idx_smoking_events_user_occurred on public.smoking_events (user_id, occurred_at);
create index idx_inventory_logs_user_occurred on public.inventory_logs (user_id, occurred_at);
create index idx_user_achievements_user on public.user_achievements (user_id);

alter table public.user_profiles enable row level security;
alter table public.smoking_events enable row level security;
alter table public.inventory_logs enable row level security;
alter table public.user_achievements enable row level security;

-- Table privileges are separate from RLS. Without these grants PostgREST returns
-- 42501 "permission denied" before evaluating the auth.uid() policies.
grant usage on schema public to authenticated;
grant select, insert, update on public.user_profiles to authenticated;
grant select, insert, update on public.smoking_events to authenticated;
grant select, insert, update on public.inventory_logs to authenticated;
grant select, insert, update on public.user_achievements to authenticated;

drop policy if exists "user_profiles_select_own" on public.user_profiles;
create policy "user_profiles_select_own" on public.user_profiles
  for select using (auth.uid() = id);

drop policy if exists "user_profiles_insert_own" on public.user_profiles;
create policy "user_profiles_insert_own" on public.user_profiles
  for insert with check (auth.uid() = id);

drop policy if exists "user_profiles_update_own" on public.user_profiles;
create policy "user_profiles_update_own" on public.user_profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "smoking_events_select_own" on public.smoking_events;
create policy "smoking_events_select_own" on public.smoking_events
  for select using (auth.uid() = user_id);

drop policy if exists "smoking_events_insert_own" on public.smoking_events;
create policy "smoking_events_insert_own" on public.smoking_events
  for insert with check (auth.uid() = user_id);

drop policy if exists "smoking_events_update_own" on public.smoking_events;
create policy "smoking_events_update_own" on public.smoking_events
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "inventory_logs_select_own" on public.inventory_logs;
create policy "inventory_logs_select_own" on public.inventory_logs
  for select using (auth.uid() = user_id);

drop policy if exists "inventory_logs_insert_own" on public.inventory_logs;
create policy "inventory_logs_insert_own" on public.inventory_logs
  for insert with check (auth.uid() = user_id);

drop policy if exists "inventory_logs_update_own" on public.inventory_logs;
create policy "inventory_logs_update_own" on public.inventory_logs
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "user_achievements_select_own" on public.user_achievements;
create policy "user_achievements_select_own" on public.user_achievements
  for select using (auth.uid() = user_id);

drop policy if exists "user_achievements_insert_own" on public.user_achievements;
create policy "user_achievements_insert_own" on public.user_achievements
  for insert with check (auth.uid() = user_id);

drop policy if exists "user_achievements_update_own" on public.user_achievements;
create policy "user_achievements_update_own" on public.user_achievements
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
