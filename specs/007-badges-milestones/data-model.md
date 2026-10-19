# Phase 1 Data Model: Badges & Milestones

New persisted unlock table plus a static catalog and derived progress. All data remains local. Existing tables are untouched.

## Entity: user_badges (new, append-only)

| Column (TS / DB) | Type | Null | Constraints / use |
|------------------|------|------|-------------------|
| `id` / `id` | integer | no | PK, autoincrement |
| `badgeKey` / `badge_key` | text | no | Unique catalog key |
| `unlockedAt` / `unlocked_at` | text ISO | no | Exact unlock moment |

**Index**: `idx_user_badges_badge_key` — UNIQUE on `badge_key`.

**Rules**

- One row per badge key; duplicate inserts are ignored.
- Unlock time is set on first insert and never updated.
- Records are never deleted by this feature.

**Migration**: additive `drizzle/0004_user_badges.sql` creating the table and unique index.

## Entity: badge catalog (static, not persisted)

| Key | Title | Condition | Target | Unit |
|-----|-------|-----------|--------|------|
| `first_pause` | Primer paso | Resisted pauses | 1 | pausas |
| `five_pauses` | Cinco pausas | Resisted pauses | 5 | pausas |
| `1_day_clean` | Un día limpio | Streak duration | 1 | días |
| `1_week_clean` | Una semana limpia | Streak duration | 7 | días |
| `1_month_clean` | Un mes limpio | Streak duration | 30 | días |
| `money_saver_10` | Ahorrador | Estimated savings | 10 | unidades |

Each definition also has a short description used on the card.

## Derived: BadgeState

| Field | Source |
|-------|--------|
| `resistedPauses` | Existing pause totals aggregation (`resisted`) |
| `streakDays` | Shared streak start (profile creation or latest ceded) and elapsed time ÷ 86,400,000 |
| `moneySaved` | Shared avoided-cigarette and savings formulas using the profile daily average and pack cost |

## Derived: BadgeStatus

| Field | Meaning |
|-------|---------|
| `definition` | Static catalog entry |
| `unlocked` | A stored row exists for the key |
| `unlockedAt` | Stored ISO value when unlocked, otherwise absent |
| `progressValue` | `min(currentValue, target)`, clamped `>= 0` |
| `progressPercent` | `min(100, currentValue / target * 100)`, clamped `>= 0` |

**Display rules**

- Catalog order is stable.
- Unlocked cards: accent styling, check/star marker, localized unlock date, no progress bar.
- Locked cards: muted styling, progress bar, `progressValue / target unit`.
- Unknown stored keys are ignored.
- Progress never exceeds 100% and never becomes negative.

## Relationships

- Each unlock belongs logically to the single local profile. No foreign key is enforced.

## State transitions (evaluation)

```text
home_focus / badges_focus
  → read profile, pause totals, latest ceded, unlocked keys
  → compute BadgeState
  → evaluate catalog
      ├─ no eligible locked badges → no write
      └─ eligible locked badges → insert missing keys (batch, same ISO moment)
  → show toast for new unlocks (once)
  → render catalog with progress/unlocked state
```

## Out of scope

Editing/deleting unlocks, a user-editable catalog, rewards beyond display, network sync, team badges, and animation-heavy celebrations.
