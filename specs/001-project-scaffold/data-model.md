# Phase 1 Data Model: Initial Project Scaffold

Local SQLite schema (Drizzle ORM) for the initial domain entities. All tables live in
`src/shared/db/schema.ts`; the client and migrator live in `src/shared/db/client.ts`. These entities
are local-only (constitution §3). Timestamps are stored as integer Unix epoch (milliseconds) unless
noted.

## Entity: user_profile

Represents the user's baseline smoker setup and active goals. Single logical row for the current
user (scaffold does not yet model multi-profile).

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | integer | PK, autoincrement | |
| `displayName` | text | nullable | Optional label |
| `dailyTarget` | integer | not null, default 0 | Max smokes/day goal |
| `smokeIntervalMinutes` | integer | not null, default 0 | Target spacing between smokes |
| `packSize` | integer | not null, default 20 | Cigarettes per pack |
| `createdAt` | integer | not null | Epoch ms |
| `updatedAt` | integer | not null | Epoch ms |

**Validation rules**: `dailyTarget >= 0`, `smokeIntervalMinutes >= 0`, `packSize > 0`.

## Entity: smoke_logs

One consumption event. May carry an emotional reason (private, on-device only).

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | integer | PK, autoincrement | |
| `createdAt` | integer | not null, indexed | Epoch ms; ordering key |
| `reason` | text | nullable | Emotional reason (private) |
| `postponed` | integer (boolean) | not null, default 0 | 1 = postponed, 0 = smoked |
| `notes` | text | nullable | Free-form |

**Validation rules**: `postponed` in {0,1}. Reads MUST be returned DESC by `createdAt`
(code-rules §11).

**State / ordering**: Newest-first retrieval is mandatory for all historical getters.

## Entity: supply_inventory

Purchased supply packages and remaining stock, used to pace consumption.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | integer | PK, autoincrement | |
| `purchasedAt` | integer | not null, indexed | Epoch ms |
| `packCount` | integer | not null, default 1 | Packs purchased |
| `cigarettesPerPack` | integer | not null, default 20 | |
| `remainingCigarettes` | integer | not null | Decrementing stock |
| `notes` | text | nullable | |

**Validation rules**: `packCount > 0`, `cigarettesPerPack > 0`, `0 <= remainingCigarettes`.

## Relationships

- `smoke_logs` and `supply_inventory` are associated with the single `user_profile` logically (no FK
  enforced in the scaffold; can be added when multi-profile is introduced).
- Inventory remaining is a derived input for pacing/analytics; it is stored, not recomputed from
  logs, in the scaffold.

## Indexes

- `smoke_logs.createdAt` (DESC retrieval per code-rules §11).
- `supply_inventory.purchasedAt`.

## Out of scope (future features)

Team/aggregate metrics, emotional-analytics tables, goal history, and any backend-synced tables are
excluded here (constitution §3 sync scope).
