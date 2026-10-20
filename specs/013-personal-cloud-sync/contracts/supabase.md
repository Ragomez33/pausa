# Contract: Supabase Remote Schema & RLS

## Remote migration

`supabase/migrations/0002_personal_data_sync.sql` must be applied to the Supabase project separately. The app never executes remote DDL.

## Tables

### user_profiles

```sql
id uuid primary key references auth.users(id) on delete cascade,
created_at timestamptz not null,
updated_at timestamptz not null,
settings jsonb not null
```

### smoking_events

```sql
id uuid primary key,
user_id uuid not null references auth.users(id) on delete cascade,
event_type text not null check (event_type in ('paused', 'smoked')),
trigger_emotion text,
outcome text check (outcome in ('resisted', 'ceded')),
notes text,
duration_seconds integer,
inventory_decremented boolean,
occurred_at timestamptz not null,
created_at timestamptz not null default now()
```

### inventory_logs

```sql
id uuid primary key,
user_id uuid not null references auth.users(id) on delete cascade,
movement_type text not null check (movement_type in ('purchase', 'consumption')),
quantity integer not null check (quantity > 0),
packs_bought integer,
cost numeric,
occurred_at timestamptz not null,
created_at timestamptz not null default now()
```

### user_achievements

```sql
id uuid primary key,
user_id uuid not null references auth.users(id) on delete cascade,
achievement_code text not null,
unlocked_at timestamptz not null,
created_at timestamptz not null default now(),
unique (user_id, achievement_code)
```

## Indexes

- `idx_smoking_events_user_occurred` on `smoking_events(user_id, occurred_at)`
- `idx_inventory_logs_user_occurred` on `inventory_logs(user_id, occurred_at)`
- `idx_user_achievements_user` on `user_achievements(user_id)`

## RLS

Enable RLS on all four tables.

- `user_profiles`: select/insert/update with `auth.uid() = id`.
- `smoking_events`, `inventory_logs`, `user_achievements`: select/insert/update with `auth.uid() = user_id`.
- No delete policies in the MVP.
- Inserts must not be able to spoof another `user_id`; use `auth.uid()` in the policy and/or a `default auth.uid()` on `user_id`.

## Client contract

```ts
export function isSupabaseConfigured(): boolean;
export function getSupabaseClient(): SupabaseClient | null;
```

- The client is created lazily and reused.
- Auth is persisted with secure storage; auto-refresh is enabled.
- Every personal request relies on the authenticated session; never pass a user id from UI input.
- Missing configuration disables cloud backup and makes no network requests.

## Security requirements

- **SUPA-1**: RLS must deny cross-account reads and writes.
- **SUPA-2**: No service-role key in the mobile bundle.
- **SUPA-3**: Remote upserts are idempotent by primary key.
- **SUPA-4**: Remote deletions are not exposed.
- **SUPA-5**: The remote schema must be reproducible from the migration file.
