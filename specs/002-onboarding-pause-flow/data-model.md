# Phase 1 Data Model: Onboarding & Pause Button Flow

Local SQLite schema (Drizzle ORM) at `src/shared/db/schema.ts`. Local-only; no synchronization in this
module (constitution §3). Timestamps are integer Unix epoch milliseconds.

## Entity: user_profile (extended)

Single logical row for the current user.

| Column (TS / DB) | Type | Constraints | Notes |
|------------------|------|-------------|-------|
| `id` / `id` | integer | PK, autoincrement | |
| `dailyCigarettes` / `daily_cigarettes` | integer | not null, default 0 | Baseline daily consumption; must be > 0 on onboarding |
| `packCost` / `pack_cost` | real | not null, default 0 | Cost per pack; must be >= 0 |
| `currency` / `currency` | text | not null, default `'USD'` | Short code; default applied when unspecified |
| `quitGoal` / `quit_goal` | text | nullable | Personal motivation (optional) |
| `createdAt` / `created_at` | integer | not null | Epoch ms |
| `updatedAt` / `updated_at` | integer | not null | Epoch ms |

**Existing scaffold columns** (`displayName`, `dailyTarget`, `smokeIntervalMinutes`, `packSize`) remain
for backward compatibility but are not used by this feature. A future cleanup can drop them.

**Validation rules**: `dailyCigarettes >= 1`; `packCost >= 0`; `currency` non-empty after defaulting;
`quitGoal` optional (free text).

## Entity: pause_events (new)

One recorded urge episode.

| Column (TS / DB) | Type | Constraints | Notes |
|------------------|------|-------------|-------|
| `id` / `id` | integer | PK, autoincrement | |
| `createdAt` / `created_at` | integer | not null, indexed | Event timestamp; ordering key |
| `triggerEmotion` / `trigger_emotion` | text | not null | One of `TRIGGER_OPTIONS` |
| `resisted` / `resisted` | integer (boolean) | not null, default 1 | 1 = resisted, 0 = ceded |
| `notes` / `notes` | text | nullable | Optional free text |

**Validation rules**: `triggerEmotion` in {`anxiety`, `work_stress`, `coffee_social`, `boredom`,
`other`}; `resisted` in {0,1}.

**Ordering**: all getters return DESC by `createdAt` (code-rules §11).

## Entity: pause_events state transitions

```text
idle → timer_running → awaiting_outcome → saved → idle
```

- `timer_running`: outcome controls disabled; leaving clears state and persists nothing.
- `awaiting_outcome`: requires a selected trigger.
- `saved`: event written locally; metrics refresh on return home.

## Relationships

- `pause_events` belongs logically to the single `user_profile` (no FK enforced in this module; can be
  added when multi-profile is introduced).

## Indexes

- `idx_pause_events_created_at` on `pause_events.created_at` (DESC retrieval).

## Derived values (not stored)

Computed by `src/modules/dashboard/utils/metrics.ts`:

- `resistedCount` = COUNT(`resisted = true`)
- `currentStreak` = most recent consecutive `resisted = true` events (DESC by timestamp)
- `moneySaved` = `resistedCount * (packCost / CIGARETTES_PER_PACK)` with `CIGARETTES_PER_PACK = 20`

## Out of scope

Network/sync, team aggregates, supply inventory changes, and multi-user profiles.
