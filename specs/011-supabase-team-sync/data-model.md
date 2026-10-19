# Phase 1 Data Model: Supabase Team Sync

Local-first queue plus remote team tables. The local database remains the source of truth for individual and team functionality; the remote database is optional and limited to shared team data.

## Local entity: team_event_outbox (new)

| Column (TS / DB) | Type | Null | Constraints / use |
|------------------|------|------|-------------------|
| `id` / `id` | text | no | PK; shared event identity |
| `teamId` / `team_id` | text | no | Active local team |
| `userName` / `user_name` | text | no | Local member name |
| `eventType` / `event_type` | text | no | `posponed` or `smoked` |
| `timestamp` / `timestamp` | text ISO | no | Event moment |
| `status` / `status` | text | no | `pending`, `sent`, `failed` |
| `attempts` / `attempts` | integer | no | Default 0 |
| `lastError` / `last_error` | text | yes | Last failure message |
| `createdAt` / `created_at` | text ISO | no | Enqueue moment |

**Index**: `idx_team_event_outbox_status` on `(status, created_at)`.

**Privacy**: no trigger emotion or notes column exists locally or remotely in this feature.

## Remote entities

### teams

`id` text PK, `name` text not null, `invite_code` text unique not null, `difficulty_level` text not null, `duration_days` integer not null, `created_at` timestamptz not null.

### team_members

`id` text PK, `team_id` text not null references teams, `user_name` text not null, `daily_limit` integer not null, `role` text not null (`leader|member`).

### shared_events

`id` text PK, `team_id` text not null, `user_name` text not null, `event_type` text not null (`posponed|smoked`), `trigger_emotion` text nullable (present for schema compatibility, **never populated by this feature**), `timestamp` timestamptz not null, `created_at` timestamptz default now().

**Remote indexes**: `team_id` on shared_events; unique invite code on teams.

## Derived: TeamSyncStatus

| Value | Meaning |
|-------|---------|
| `disabled` | Missing/invalid config; no network calls |
| `synced` | Configured, no pending events, last sync succeeded |
| `pending` | Configured, one or more queued events |
| `offline` | Configured, last attempt failed (network/server) |
| `syncing` | A flush is in progress |
| `error` | Auth/RLS/schema error requiring attention |

Derived from configuration, outbox counts, and the last flush result.

## Derived: RemoteMemberMetrics

Built from remote `shared_events` for members other than the local user.

| Field | Formula |
|-------|---------|
| `postponedCount` | Count of `posponed` events |
| `smokedToday` | Count of `smoked` events whose local day equals today |
| `streakDays` | Consecutive local days ending today where smoked count `<= dailyLimit`; days with no events count as compliant |
| `hadStumble` | True when the member has at least one smoked event on a day still within the limit |

The local user ("Tú") keeps local snapshot values and ignores remote echoes to avoid double counting.

## State transitions

```text
local action saved
  → active team? no → no shared event
  → yes → outbox(pending)

pending → flush start → syncing
  ├─ upsert success → sent
  ├─ retryable failure → failed (attempts+1) → retry later
  └─ fatal config/auth error → failed + sync status error

dashboard open with config
  → subscribe(team_id)
  → INSERT event → dedupe by id → merge remote members → recalc summary/leaderboard
  → team change/unmount → unsubscribe
```

## Migration

`drizzle/0007_team_sync_outbox.sql` creates `team_event_outbox` + index. The remote SQL lives in `supabase/migrations/0001_team_sync.sql` and is applied to the Supabase project separately.

## Out of scope

Cross-device join-by-code, full bidirectional team/member sync, chat, remote history screens, uploading trigger emotions/notes, background OS sync, and offline authentication.
