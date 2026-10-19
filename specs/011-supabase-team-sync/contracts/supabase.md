# Contract: Supabase Client & Remote Schema

## Environment

```text
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY
```

- Missing or invalid values → `isSupabaseConfigured() === false`, client `null`, no network calls.
- Only public anon credentials are used. No service-role key.
- `.env` is gitignored; `.env.example` documents placeholders.

## Client

`src/services/supabase.ts`

```ts
export function isSupabaseConfigured(): boolean;
export function getSupabaseClient(): SupabaseClient | null;
```

- The client is created lazily and reused.
- No client creation at module import time if configuration is absent.

## Remote schema (`supabase/migrations/0001_team_sync.sql`)

`teams`:
`id` text PK, `name` text not null, `invite_code` text unique not null, `difficulty_level` text not null, `duration_days` integer not null, `created_at` timestamptz not null.

`team_members`:
`id` text PK, `team_id` text not null → teams, `user_name` text not null, `daily_limit` integer not null, `role` text not null.

`shared_events`:
`id` text PK, `team_id` text not null, `user_name` text not null, `event_type` text not null (`posponed|smoked`), `trigger_emotion` text nullable (unused), `timestamp` timestamptz not null, `created_at` timestamptz default now().

**RLS**: anon may read team/shared-event data and insert shared events/members; destructive updates/deletes are denied. Realtime enabled for `shared_events`.

## Team mirroring

- After successful local create/join, best-effort upsert `teams`/`team_members` when configured.
- Mirroring failures never block or roll back the local action.
- Upserts are idempotent by id.

## Privacy

- Outgoing payloads MUST NOT include `trigger_emotion`, notes, pause history, or any individual emotional data.
- The remote trigger column remains nullable and unused unless a future explicit-consent feature exists.
