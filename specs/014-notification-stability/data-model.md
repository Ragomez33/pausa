# Phase 1 Data Model: Notification Stability

No schema change. The feature reads existing tables and the `sync_state` KV store.

## Read-only entities

### user_profile

| Field | Use |
|-------|-----|
| `dailyCigarettes` | Idle interval: `clamp(16 × 60 / daily, 30, 240)` |

### smoking_events / pause_events

| Field | Use |
|-------|-----|
| `timestamp` (ISO string) | Candidate idle anchor |

The idle anchor is the maximum parsed timestamp across both tables; null history falls back to "now".

### active_smoking_session

| Field | Use |
|-------|-----|
| `id` | Identifier passed to `clearActiveSmokingSession` |
| `startedAtMs` | Orphan classification |

### sync_state

| Key | Value | Use |
|-----|-------|-----|
| `notification_exact_alarm_hint_shown` | `'shown'` | Show the exact-alarm guidance once per installation |

## Derived: IdleSchedule (anchored)

| Field | Meaning |
|-------|---------|
| `intervalMinutes` | `clamp(16 × 60 / daily, 30, 240)` |
| `anchorMs` | Latest real interaction, or now |
| `scheduledAtMs` | `anchorMs + interval`, or `now + interval` when that target already passed |
| `pendingCount` | Exactly 0 or 1 |

## Derived: OrphanSession

| Condition | Result |
|-----------|--------|
| `now - startedAtMs >= 30 min` | Orphaned |
| `now - startedAtMs < 0` (future) | Orphaned |
| Non-finite `startedAtMs` / `nowMs` | Orphaned |
| Otherwise | Preserved |

## Derived: PromptBoundary

| Field | Meaning |
|-------|---------|
| `boundaryMinutes` | `floor(elapsedMinutes / 5) × 5`, capped at 60 |
| `announced` | Latest boundary shown by the foreground fallback |

## State transitions

```text
ready(cold start)
  → orphan session (>= 30 min) → delete row + cancel session prompts
  → session still recent           → cancel idle, keep session
  → no session                     → ensure idle (pending? leave : anchor schedule)

app active
  → session present → cancel idle
  → no session      → ensure idle (never cancels an existing pending reminder)

app background
  → session present → cancel idle
  → no session      → cancel + anchor schedule

real interaction (postpone / record session)
  → cancel + anchor schedule from the new event

idle fires while app closed
  → next active/background → ensure/reset re-arms exactly one reminder
```
