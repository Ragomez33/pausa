# Phase 1 Data Model: Teams & Level Challenges

Local-only schema redesign. Existing stub team tables are rebuilt. All data stays on the device.

## Entity: teams (rebuilt)

| Column (TS / DB) | Type | Null | Constraints / use |
|------------------|------|------|-------------------|
| `id` / `id` | text | no | PK (locally generated) |
| `name` / `name` | text | no | 2–40 characters |
| `inviteCode` / `invite_code` | text | no | Unique, 6 uppercase alphanumeric characters |
| `difficultyLevel` / `difficulty_level` | text | no | `facil`, `medio`, `dificil`, `modo_dios` |
| `durationDays` / `duration_days` | integer | no | Positive whole days |
| `createdAt` / `created_at` | text ISO | no | Creation moment |

**Index**: unique `idx_teams_invite_code`.

## Entity: team_members (rebuilt)

| Column (TS / DB) | Type | Null | Constraints / use |
|------------------|------|------|-------------------|
| `id` / `id` | text | no | PK (locally generated) |
| `teamId` / `team_id` | text | no | FK → `teams.id`, cascade delete |
| `userName` / `user_name` | text | no | Local display name ("Tú" by default) |
| `dailyLimit` / `daily_limit` | integer | no | Calculated from profile/level |
| `role` / `role` | text | no | `leader` or `member` |
| `joinedAt` / `joined_at` | text ISO | no | Active-team selection |
| `postponedCount` / `postponed_count` | integer | no | Default 0; snapshot |
| `smokedToday` / `smoked_today` | integer | no | Default 0; snapshot |
| `streakDays` / `streak_days` | integer | no | Default 0; snapshot |
| `hadStumble` / `had_stumble` | integer 0/1 | no | Default 0; snapshot |

**Index**: `idx_team_members_team_id`.

## Derived: Difficulty and daily limit

| Level | Label | Multiplier | Example at 20/day |
|-------|-------|------------|-------------------|
| `facil` | Fácil | 1.00 | 20 |
| `medio` | Medio | 0.75 | 15 |
| `dificil` | Difícil | 0.50 | 10 |
| `modo_dios` | Modo Dios | 0.25 | 5 |

`dailyLimit = floor(profile.dailyCigarettes × multiplier)`, minimum 0.

## Derived: TeamSummary

| Field | Formula / meaning |
|-------|-------------------|
| `team` | Team row |
| `members` | Members of the active team |
| `collectivePostponed` | Sum of member `postponed_count` |
| `avoidedCigarettes` | Collective postponed (one postponement ≈ one avoided cigarette) |
| `moneySaved` | `(avoidedCigarettes / 20) × profile.pack_cost` |
| `remainingDays` | `max(0, ceil((createdAt + durationDays) - now))` |
| `expired` | Duration elapsed |

## Derived: Leaderboard

| Distinction | Rule |
|-------------|------|
| El Guardián | Highest `postponed_count` |
| El Inquebrantable | Highest `streak_days` |
| El Resiliente | Highest `streak_days` among members with `had_stumble = 1` and `smoked_today <= daily_limit` |

Ties: `user_name` locale compare, then member id. No eligible member → empty state.

## State transitions

```text
team_dashboard(empty) → create_team → team_created(leader) → dashboard
                     → join_team(code) → member_added → dashboard

create_form → validate → transaction(team + leader) → dashboard
join_form   → normalize code → find local team → check duplicate → insert member → dashboard
```

## Migration

`drizzle/0006_teams_challenges.sql` drops the stub `team_members` and `teams` tables and recreates them with the new columns/indexes. The stub tables contained no user-created rows (the previous team UI only displayed a count).

## Out of scope

Real multi-device teams, network sync, invite-code lookup across devices, team chat, editing/deleting teams, and historical leaderboard snapshots.
