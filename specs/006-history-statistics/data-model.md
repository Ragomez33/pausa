# Phase 1 Data Model: History & Statistics

No schema change is required. The feature reads `pause_events` (with aggregate queries) and `user_profile` (streak start and onboarding guard). Everything is derived locally.

## Entity: pause_events (read-only)

| Column (TS / DB) | Type | Use |
|------------------|------|-----|
| `id` / `id` | integer | Deterministic tie-break for identical timestamps |
| `timestamp` / `timestamp` | text ISO | Displayed date/time; DESC ordering; streak reset marker |
| `triggerEmotion` / `trigger_emotion` | text | Trigger label and grouped counts |
| `resisted` / `resisted` | integer 0/1 | Status label; success rate; latest ceded lookup |
| `notes` / `notes` | text nullable | Optional row notes |

**Query rules**

- List: `ORDER BY timestamp DESC, id DESC`.
- Totals: `count(*)`, resisted count, ceded count.
- Trigger groups: `GROUP BY trigger_emotion` with counts.
- Latest ceded: `MAX(timestamp) WHERE resisted = 0`.

## Entity: user_profile (read-only)

| Field | Use |
|-------|-----|
| `createdAt` | Initial streak start when no ceded event exists |
| `dailyCigarettes`, `packCost`, `currency`, `quitGoal` | Not used by this feature |

## Derived: HistoryEntry

A display projection of a pause event.

| Field | Meaning |
|-------|---------|
| `id` | Stable row key |
| `timestamp` | Raw ISO value |
| `dateTimeLabel` | Localized date/time |
| `triggerLabel` | Human-readable trigger (current, legacy, or fallback) |
| `outcomeLabel` | "Superado con éxito" or "Cedió" |
| `resisted` | Original outcome for styling |
| `notes` | Trimmed notes or `null` |

## Derived: PauseAnalytics (not stored)

| Field | Formula / meaning |
|-------|-------------------|
| `total` | Total pause events |
| `resisted` | Events with `resisted = 1` |
| `ceded` | Events with `resisted = 0` |
| `successRate` | `total > 0 ? (resisted / total) * 100 : 0` |
| `streakStart` | ISO timestamp of the profile creation or latest ceded event, whichever is later |
| `elapsedMs` | `max(0, now - streakStartMs)` |
| `streakDays` | `floor(elapsedMs / 86_400_000)` |
| `streakHours` | `floor((elapsedMs % 86_400_000) / 3_600_000)` |
| `triggers` | Observed triggers with `{ triggerEmotion, label, count, percentage }`, sorted by count DESC then label |

**Display rules**

- Zero events: success rate shows "Sin datos"; trigger breakdown shows an empty state.
- Streak always shows days/hours, even with no events (from profile creation).
- Percentages are rounded for display; bar width is `count / maxCount * 100%`.
- Notes that are null, empty, or whitespace are hidden.
- Invalid dates are shown as the raw value; invalid trigger codes get a readable fallback label.

## Relationships

- Each pause event belongs to the single local profile. No foreign key is enforced.
- Analytics are computed on demand and never persisted.

## State transitions (screen)

```text
loading → ready(events + analytics)
        ↘ storage_error
        ↘ no_profile → onboarding
ready → focus → reload → ready
```

## Out of scope

Schema changes, inventory-consumption history, editing/deleting events, filters/search, pagination controls, export, network sync, and persisted analytics.
