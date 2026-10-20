# Phase 1 Data Model: Home Metrics & Pause Impulse Logging

No schema change is required. The feature reads `user_profile` and `pause_events` (created in feature 003) and writes new `pause_events` rows. All data remains local.

## Entity: user_profile (read-only for this feature)

Single row for the current user.

| Column (TS / DB) | Type | Use in this feature |
|------------------|------|---------------------|
| `id` / `id` | integer | Internal identity |
| `dailyCigarettes` / `daily_cigarettes` | integer | Daily average for avoided-cigarette math |
| `packCost` / `pack_cost` | real | Cost per 20 cigarettes for money math |
| `currency` / `currency` | text | Display symbol/code |
| `quitGoal` / `quit_goal` | text | Not used |
| `createdAt` / `created_at` | text ISO | Initial streak start |

**Constraint**: exactly one profile exists whenever home is shown; otherwise the app routes to onboarding.

## Entity: pause_events (append-only)

One row per completed intervention.

| Column (TS / DB) | Type | Null | Validation / use |
|------------------|------|------|------------------|
| `id` / `id` | integer | no | PK, autoincrement |
| `timestamp` / `timestamp` | text ISO | no | Event moment; latest ceded event starts a new streak |
| `triggerEmotion` / `trigger_emotion` | text | no | New writes use one of the five trigger codes |
| `resisted` / `resisted` | integer 0/1 | no | `1` = resisted, `0` = ceded |
| `notes` / `notes` | text | yes | Optional, trimmed, max 200 characters; empty → `null` |

**Trigger codes for new events**

| Code | Label |
|------|-------|
| `anxiety` | Ansiedad |
| `stress` | Estrés |
| `boredom` | Aburrimiento |
| `habit_social` | Hábito/Social |
| `anger_frustration` | Ira/Frustración |

Historical stored codes (`work_stress`, `coffee_social`, `other`) remain valid as opaque strings and are not rewritten.

## Derived entity: HomeMetrics and HistorySummary (not stored)

Computed from the profile, all stored events, inventory records, and a `now` timestamp. Home displays only `elapsedMs` and the resisted/ceded counts; the remaining fields feed History/Statistics.

| Field | Meaning |
|-------|---------|
| `resistedCount` | Lifetime count of `resisted = 1` |
| `cededCount` | Lifetime count of `resisted = 0` |
| `elapsedMs` | `max(0, now - streakStart)` in milliseconds |
| `streakStart` | ISO timestamp of the current streak start |
| `avoidedCigarettes` | `dailyCigarettes * (elapsedMs / 86_400_000)` when daily > 0, else 0 |
| `moneySaved` | `(avoidedCigarettes / 20) * packCost` when packCost > 0, else 0 |
| `currency` | Profile currency |

**Streak start rules**

1. Start with `user_profile.created_at`.
2. If any event has `resisted = 0`, use the most recent such event's `timestamp` when it is later than the profile creation time.
3. Invalid or future timestamps are defensively clamped so elapsed time is never negative.

**Display rules**

- Home: compact duration (for example `3d 4h 12m`) and a today summary such as `1 Pausa | 1 Fumado`.
- Home: no avoided-cigarette, money, inventory-spending, or pack cards.
- History/Statistics: avoided cigarettes at most one decimal, money with the existing currency formatter, and inventory spending with the profile currency.
- Counters: resisted and ceded shown separately on home; detailed totals are available in History/Statistics.

## Relationships

- `pause_events` belongs logically to the single local profile. No foreign key is enforced (single-user local store).
- No derived metric is persisted; all values are recomputed from source rows.

## State transitions (intervention)

```text
home → intervention_countdown → awaiting_trigger → saving → home(success feedback)
                                ↘ no trigger selected → awaiting_trigger (toast)
intervention_countdown → left screen → home (nothing stored)
saving → storage error → intervention (toast, nothing partial)
```

- `intervention_countdown`: outcome actions disabled; breathing visual active.
- `awaiting_trigger`: trigger selector and notes input available; outcome actions enabled.
- `saving`: duplicate-save guard active; controls disabled.
- `home(success feedback)`: focus refresh recomputes metrics and shows the reinforcement banner.

## Indexes

- Existing `idx_pause_events_timestamp` on `pause_events.timestamp` supports newest-first reads and latest-ceded lookup.

## Out of scope

Schema changes, trigger rewriting, network sync, team aggregates, editing/deleting events, and historical analytics beyond the home summary.
