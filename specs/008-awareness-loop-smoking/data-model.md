# Phase 1 Data Model: Awareness Loop & Smoking Session

New tables/column plus derived daily metrics. All data remains local. Existing tables are preserved; `user_profile` gains one additive column.

## Entity: user_profile (extended)

| Column (TS / DB) | Type | Null | Notes |
|------------------|------|------|-------|
| `postponedCount` / `postponed_count` | integer | no | Default 0; incremented by the loop's "Sí" branch |

All existing fields remain unchanged.

## Entity: smoking_events (new)

| Column (TS / DB) | Type | Null | Notes |
|------------------|------|------|-------|
| `id` / `id` | integer | no | PK, autoincrement |
| `timestamp` / `timestamp` | text ISO | no | Session completion moment; indexed |
| `triggerEmotion` / `trigger_emotion` | text | no | One of `anxiety_stress`, `boredom`, `habit`, `social_pressure` |
| `durationSeconds` / `duration_seconds` | integer | no | Positive whole seconds |
| `inventoryDecremented` / `inventory_decremented` | integer 0/1 | no | 1 when a cigarette was subtracted |

**Index**: `idx_smoking_events_timestamp`.

## Entity: active_smoking_session (new)

Single-row table that persists the in-progress session so notifications can reopen it after the app is backgrounded or closed.

| Column (TS / DB) | Type | Null | Notes |
|------------------|------|------|-------|
| `id` / `id` | text | no | PK; generated session id (`session-<ms>-<suffix>`) |
| `triggerEmotion` / `trigger_emotion` | text | no | One of `anxiety_stress`, `boredom`, `habit`, `social_pressure` |
| `startedAtMs` / `started_at_ms` | integer | no | Wall-clock start in milliseconds used to rebuild elapsed time |
| `createdAt` / `created_at` | text ISO | no | Creation moment |

A maximum of one row exists. Starting a session replaces any previous row; finishing or discarding removes it.

## Entity: teams (new)

| Column (TS / DB) | Type | Null | Notes |
|------------------|------|------|-------|
| `id` / `id` | integer | no | PK, autoincrement |
| `name` / `name` | text | no | Team/challenge name |
| `goalLevel` / `goal_level` | text | no | `facil`, `medio`, `dificil`, `modo_dios` |
| `durationDays` / `duration_days` | integer | no | Positive challenge duration |
| `createdAt` / `created_at` | text ISO | no | Creation moment |

## Entity: team_members (new)

| Column (TS / DB) | Type | Null | Notes |
|------------------|------|------|-------|
| `id` / `id` | integer | no | PK, autoincrement |
| `teamId` / `team_id` | integer | no | References `teams.id` |
| `localName` / `local_name` | text | no | Local user/display name |
| `dailyLimit` / `daily_limit` | integer | no | Daily cigarette limit |
| `status` / `status` | text | no | Membership status (e.g. active/inactive) |

**Index**: `idx_team_members_team_id`. Foreign key to `teams.id`.

## Entity: inventory_logs (reused)

A completed session with available stock inserts one `consumption` movement of quantity 1. No schema change.

## Derived: session/daily metrics

| Field | Formula |
|-------|---------|
| `elapsedSeconds` | `max(0, floor((now - startedAt) / 1000))` |
| `durationSeconds` | elapsed at "Terminé", minimum 1 |
| `smokedToday` | count of `smoking_events` between local-day start and end |
| `dailyLimit` | `user_profile.daily_cigarettes` |
| `inventoryDecremented` | 1 if stock > 0 at finish, else 0 |

## State transitions

### Awareness loop

```text
home → postpone_question
  ├─ Sí → increment postponed_count → positive message → home
  └─ No → emotion_selector → message → "Iniciar Cigarrillo" → smoking_session
       └─ abandoned → home (nothing persisted)
```

### Smoking session

```text
session_started → active_smoking_session row + 12 local notifications
  ├─ every 300s → local notification("¿Terminaste?") (no in-app modal)
  │    ├─ Seguir → timer_running
  │    └─ Terminé → recording → cancel notifications → home
  ├─ notification tap → reopen /smoking-session for the persisted row
  ├─ elapsed ≥ 30 min → offer finish or discard
  └─ leave before finish → clear row + cancel notifications → home (nothing persisted)
recording → event insert + active row delete + optional inventory consumption (transaction) → home
```

## Notification identifiers

| Prefix | Owner | Cancellation |
|--------|-------|--------------|
| `idle-reminder` | Idle reminder | Exact identifier only |
| `smoking-session:<sessionId>:<minutes>` | Active session | Prefix `smoking-session:` only |

Session scheduling and cancellation never call `cancelAllScheduledNotificationsAsync()`.

## Out of scope

Full team CRUD/synchronization, leaderboard calculations, remote notifications, and editing/deleting smoking events.
