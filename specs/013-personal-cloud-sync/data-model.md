# Phase 1 Data Model: Personal Data Cloud Backup (Local-First)

The local SQLite database remains authoritative for every UI read. Remote Supabase tables are a backup/restore copy, scoped by the authenticated account. All local changes are made through Drizzle.

## Local schema changes

### user_profile (extended)

| Column (TS / DB) | Type | Null | Notes |
|------------------|------|------|-------|
| `ownerUserId` / `owner_user_id` | text | yes | `null` = guest scope; otherwise the Supabase user id |
| `updatedAt` / `updated_at` | text ISO | no | LWW marker for profile/settings; defaults to `created_at` |

All existing columns remain.

### pause_events (extended)

| Column | Type | Null | Notes |
|--------|------|------|-------|
| `syncId` / `sync_id` | text UUID | no | Stable remote identity; unique |
| `ownerUserId` / `owner_user_id` | text | yes | Active data scope |

Existing columns: `id`, `timestamp`, `trigger_emotion`, `resisted`, `notes`.

### smoking_events (extended)

| Column | Type | Null | Notes |
|--------|------|------|-------|
| `syncId` / `sync_id` | text UUID | no | Stable remote identity; unique |
| `ownerUserId` / `owner_user_id` | text | yes | Active data scope |

Existing columns: `id`, `timestamp`, `trigger_emotion`, `duration_seconds`, `inventory_decremented`.

### inventory_logs (extended)

| Column | Type | Null | Notes |
|--------|------|------|-------|
| `syncId` / `sync_id` | text UUID | no | Stable remote identity; unique |
| `ownerUserId` / `owner_user_id` | text | yes | Active data scope |

Existing columns: `id`, `timestamp`, `action_type`, `quantity`, `cost`.

### user_badges (extended)

| Column | Type | Null | Notes |
|--------|------|------|-------|
| `syncId` / `sync_id` | text UUID | no | Stable remote identity; unique |
| `ownerUserId` / `owner_user_id` | text | yes | Active data scope |

Existing columns: `id`, `badge_key`, `unlocked_at`.

### global_sync_outbox (new)

| Column (TS / DB) | Type | Null | Notes |
|------------------|------|------|-------|
| `id` / `id` | text UUID | no | PK; outbox row identity |
| `entityType` / `entity_type` | text | no | `profile`, `smoking_event`, `inventory_log`, `achievement` |
| `entityId` / `entity_id` | text | no | Local `sync_id` or profile id |
| `payload` / `payload` | text JSON | no | Immutable remote payload snapshot |
| `status` / `status` | text | no | `pending`, `sent`, `failed` |
| `attempts` / `attempts` | integer | no | Default 0 |
| `lastError` / `last_error` | text | yes | Last failure message |
| `createdAt` / `created_at` | text ISO | no | Enqueue moment |
| `updatedAt` / `updated_at` | text ISO | no | Last state change |

**Indexes**:
- unique `idx_global_sync_outbox_entity` on `(entity_type, entity_id)` so a newer profile payload replaces a pending one;
- `idx_global_sync_outbox_status` on `(status, created_at)`.

Sent rows may be pruned after a retention window (e.g. 7 days) because remote upserts are idempotent.

### sync_state (new)

Key/value table for non-domain synchronization state.

| Column | Type | Null | Notes |
|--------|------|------|-------|
| `key` / `key` | text | no | PK |
| `value` / `value` | text | no | Serialized value |
| `updatedAt` / `updated_at` | text ISO | no | Last write |

**Keys**:
- `active_scope` — `guest` or a Supabase user id;
- `backup_enabled` — `true|false`, default `false`;
- `backup_owner` — user id that opted in, so a different account does not inherit consent;
- `consent_emotions` — `true|false`, default `false`;
- `last_pull_events`, `last_pull_inventory`, `last_pull_achievements` — restore checkpoints;
- `last_sync_at` — last successful personal flush.

### active_smoking_session

Unchanged and local-only. In-progress sessions are not backed up; only completed events are.

## Remote schema (Supabase)

### user_profiles

| Column | Type | Null | Notes |
|--------|------|------|-------|
| `id` | uuid | no | PK; must equal `auth.uid()` |
| `created_at` | timestamptz | no | Profile creation |
| `updated_at` | timestamptz | no | LWW marker |
| `settings` | jsonb | no | `{ dailyCigarettes, packCost, currency, quitGoal, postponedCount }` |

RLS: select/insert/update require `auth.uid() = id`. No delete policy.

### smoking_events

| Column | Type | Null | Notes |
|--------|------|------|-------|
| `id` | uuid | no | PK; local `sync_id` |
| `user_id` | uuid | no | Owner; defaults to `auth.uid()` |
| `event_type` | text | no | `paused` or `smoked` |
| `trigger_emotion` | text | yes | Only sent with emotional consent |
| `outcome` | text | yes | `resisted`/`ceded` for pauses; null for smoking |
| `notes` | text | yes | Only sent with emotional consent |
| `duration_seconds` | integer | yes | Smoking duration; null for pauses |
| `inventory_decremented` | boolean | yes | Smoking inventory impact |
| `occurred_at` | timestamptz | no | Local event timestamp |
| `created_at` | timestamptz | no | Remote insert moment |

Index: `(user_id, occurred_at)`. RLS: `auth.uid() = user_id`. No delete policy.

### inventory_logs

| Column | Type | Null | Notes |
|--------|------|------|-------|
| `id` | uuid | no | PK; local `sync_id` |
| `user_id` | uuid | no | Owner |
| `movement_type` | text | no | `purchase` or `consumption` |
| `quantity` | integer | no | Cigarettes moved |
| `packs_bought` | integer | yes | Purchase packs when applicable |
| `cost` | numeric | yes | Purchase cost |
| `occurred_at` | timestamptz | no | Local movement timestamp |
| `created_at` | timestamptz | no | Remote insert moment |

Index: `(user_id, occurred_at)`. RLS: `auth.uid() = user_id`. No delete policy.

### user_achievements

| Column | Type | Null | Notes |
|--------|------|------|-------|
| `id` | uuid | no | PK; local `sync_id` |
| `user_id` | uuid | no | Owner |
| `achievement_code` | text | no | Stable local badge key |
| `unlocked_at` | timestamptz | no | Unlock moment |
| `created_at` | timestamptz | no | Remote insert moment |

Unique: `(user_id, achievement_code)`. RLS: `auth.uid() = user_id`. No delete policy.

## Payload mapping

| Local source | Remote target | Mapping |
|--------------|---------------|---------|
| `user_profile` in active scope | `user_profiles` | `id = owner_user_id`, `settings` from profile fields, `updated_at` from local LWW marker |
| `pause_events` | `smoking_events` | `event_type = 'paused'`, `outcome` from `resisted`, emotional fields gated by consent |
| `smoking_events` | `smoking_events` | `event_type = 'smoked'`, duration and inventory flag |
| `inventory_logs` | `inventory_logs` | `movement_type` from `action_type`, `quantity`, cost; `packs_bought` only for purchase |
| `user_badges` | `user_achievements` | `achievement_code = badge_key`, `unlocked_at` |

## Restore rules

1. Fetch remote rows for the authenticated account in pages of 500.
2. Insert local rows by `sync_id` with conflict-ignore.
3. Apply a remote profile only when its `updated_at` is newer than the local profile's.
4. Preserve every local row that is newer, unsynced, or owned by another scope.
5. Persist a checkpoint per remote table after each successful page.
6. Never delete local rows as part of restore.
7. After restore, backfill only local-only or newer records; do not re-enqueue a profile whose restored remote version won the LWW comparison.

## State transitions

```text
local mutation (active scope)
  → SQLite commit
  → backup enabled + owner authenticated? no → stop (local-only)
  → yes → outbox(pending) → flush → upsert remote → sent

offline / network failure
  → failed (attempts+1) → retry on enqueue, foreground, auth change, or timer

auth/RLS/schema failure
  → failed + fatal status → local work continues

sign-in / enable backup
  → active_scope = user id
  → optional guest-data adoption
  → pull remote pages → hydrate local by sync_id
  → enqueue unsynced local rows (backfill)
```

## Migrations

- Local: `drizzle/0009_personal_cloud_sync.sql`, journal, `drizzle/migrations.js`, and bootstrap SQL in `useDatabaseInitialized.ts`.
- Remote: `supabase/migrations/0002_personal_data_sync.sql`, applied separately to the Supabase project.
- Existing local rows receive `sync_id` values through a one-time post-migration backfill using `expo-crypto.randomUUID()`.

## Out of scope

Remote deletion/tombstones, in-progress session backup, real-time personal data subscriptions, conflict UI, multi-account simultaneous sessions, and full bidirectional team sync.
