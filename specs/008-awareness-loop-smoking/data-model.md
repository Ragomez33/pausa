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
session_started → timer_running
  ├─ every 300s → prompt("¿Terminaste?")
  │    ├─ Seguir → timer_running
  │    └─ Terminé → recording → home
  └─ leave before finish → home (nothing persisted)
recording → event insert + optional inventory consumption (transaction) → home
```

## Out of scope

Full team CRUD/synchronization, leaderboard calculations, background timer persistence, editing/deleting smoking events, and remote notifications.
