# Phase 1 Data Model: Local Persistence & Startup Routing

Local SQLite database `pausa.db` accessed through Drizzle ORM at `src/db/`. All data is local-only; no
network synchronization in this feature (constitution §3). Timestamps are ISO-8601 UTC text.

## Entity: user_profile

Single logical row representing the current user. At most one profile may exist.

| Column (TS / DB) | Type | Constraints | Notes |
|------------------|------|-------------|-------|
| `id` / `id` | integer | PK, autoincrement, not null | |
| `dailyCigarettes` / `daily_cigarettes` | integer | not null | Positive integer; validated on onboarding |
| `packCost` / `pack_cost` | real | not null | Numeric `>= 0` |
| `currency` / `currency` | text | not null | Short currency code; default applied when unspecified |
| `quitGoal` / `quit_goal` | text | not null | Personal motivation; empty value replaced by a documented default |
| `createdAt` / `created_at` | text | not null | ISO-8601 UTC (`toISOString()`) |

**Validation rules**

- `dailyCigarettes` MUST be an integer `>= 1`.
- `packCost` MUST be numeric and `>= 0`.
- `currency` MUST be non-empty after applying the default.
- `quitGoal` MUST be a trimmed string (max 280 characters); when empty, a default goal is stored.
- `createdAt` MUST be generated at insert time and never supplied by the UI.

**Invariant**: `SELECT COUNT(*) FROM user_profile` is 0 or 1. A second onboarding submission MUST NOT
insert another row.

## Entity: pause_events

One recorded urge episode.

| Column (TS / DB) | Type | Constraints | Notes |
|------------------|------|-------------|-------|
| `id` / `id` | integer | PK, autoincrement, not null | |
| `timestamp` / `timestamp` | text | not null, indexed | ISO-8601 UTC event moment; DESC ordering key |
| `triggerEmotion` / `trigger_emotion` | text | not null | One of `TRIGGER_OPTIONS` |
| `resisted` / `resisted` | integer (boolean) | not null | `1` = resisted, `0` = ceded |
| `notes` / `notes` | text | nullable | Optional free text |

**Validation rules**

- `triggerEmotion` MUST be one of `anxiety`, `work_stress`, `coffee_social`, `boredom`, `other`.
- `resisted` MUST be `0` or `1`.
- `notes` may be `null` or an empty/omitted value at the UI boundary.

**Ordering**: all historical getters return records DESC by `timestamp` (code-rules §11).

## Relationships

- `pause_events` belongs logically to the single `user_profile`. No foreign key is enforced because the
  product supports one local user; the relationship is documented rather than constrained.

## Indexes

- `idx_pause_events_timestamp` on `pause_events.timestamp` for DESC retrieval.

## Migration mapping (legacy → target)

| Legacy | Target | Transformation |
|--------|--------|----------------|
| `user_profile.daily_cigarettes` (integer) | `daily_cigarettes` | Preserved |
| `user_profile.pack_cost` (real) | `pack_cost` | Preserved |
| `user_profile.currency` (text) | `currency` | Preserved |
| `user_profile.quit_goal` (text, nullable) | `quit_goal` (not null) | `COALESCE(quit_goal, '')` |
| `user_profile.created_at` (integer ms) | `created_at` (text ISO) | `strftime('%Y-%m-%dT%H:%M:%fZ', created_at / 1000.0, 'unixepoch')` |
| `user_profile.display_name`, `daily_target`, `smoke_interval_minutes`, `pack_size`, `updated_at` | — | Dropped (unused scaffold columns) |
| `pause_events.created_at` (integer ms) | `timestamp` (text ISO) | Renamed + converted with the same `strftime` expression |
| `pause_events.trigger_emotion` | `trigger_emotion` | Preserved |
| `pause_events.resisted` (integer) | `resisted` | Preserved |
| `pause_events.notes` | `notes` | Preserved |

Primary keys and row counts are preserved. The migration is idempotent through the Drizzle migration
journal, with a `CREATE TABLE IF NOT EXISTS` bootstrap fallback for databases without journal metadata.

## Derived values (not stored)

Computed elsewhere from stored records; unchanged semantics:

- `resistedCount` = count of `resisted = 1`.
- `currentStreak` = most recent consecutive `resisted = 1` events in DESC timestamp order.
- `moneySaved` = `resistedCount * (packCost / CIGARETTES_PER_PACK)`.

## State transitions (onboarding)

```text
storage_preparing → no_profile → onboarding_form → validated → saved → home
                 ↘ profile_exists → home
storage_preparing → setup_error → error_state
```

- `storage_preparing`: root layout shows a loading indicator; no app content.
- `no_profile`: redirect to `/onboarding`.
- `validated`: submit is enabled; invalid values are blocked via toast.
- `saved`: exactly one profile exists; replace to `/`.
- `setup_error`: root layout shows a clear error message.

## Out of scope

Network/sync, team aggregates, multi-user profiles, editing/deleting the profile, and changes to smoke
logs or supply inventory.
