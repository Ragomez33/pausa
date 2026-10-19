-- Remote schema for local-first team sharing.
-- Apply this migration to the Supabase project used by the app.

create table if not exists public.teams (
  id text primary key,
  name text not null,
  invite_code text not null unique,
  difficulty_level text not null check (difficulty_level in ('facil', 'medio', 'dificil', 'modo_dios')),
  duration_days integer not null check (duration_days > 0),
  created_at timestamptz not null
);

create table if not exists public.team_members (
  id text primary key,
  team_id text not null references public.teams(id) on delete cascade,
  user_name text not null,
  daily_limit integer not null,
  role text not null check (role in ('leader', 'member'))
);

create index if not exists idx_team_members_team_id on public.team_members (team_id);

create table if not exists public.shared_events (
  id text primary key,
  team_id text not null references public.teams(id) on delete cascade,
  user_name text not null,
  event_type text not null check (event_type in ('posponed', 'smoked')),
  trigger_emotion text,
  timestamp timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_shared_events_team_id on public.shared_events (team_id);
create index if not exists idx_shared_events_team_timestamp on public.shared_events (team_id, timestamp);

alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.shared_events enable row level security;

drop policy if exists "teams_read" on public.teams;
create policy "teams_read" on public.teams for select using (true);
drop policy if exists "teams_insert" on public.teams;
create policy "teams_insert" on public.teams for insert with check (true);

drop policy if exists "team_members_read" on public.team_members;
create policy "team_members_read" on public.team_members for select using (true);
drop policy if exists "team_members_insert" on public.team_members;
create policy "team_members_insert" on public.team_members for insert with check (true);

drop policy if exists "shared_events_read" on public.shared_events;
create policy "shared_events_read" on public.shared_events for select using (true);
drop policy if exists "shared_events_insert" on public.shared_events;
create policy "shared_events_insert" on public.shared_events for insert with check (true);

alter publication supabase_realtime add table public.shared_events;
