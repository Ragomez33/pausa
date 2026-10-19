# Phase 1 Data Model: Smart Idle Notifications

No database schema change. The feature reads `user_profile` for the daily cigarette average and owns one pending local notification. All data is device-local.

## Entity: user_profile (read-only)

| Field | Use |
|-------|-----|
| `dailyCigarettes` | Idle interval calculation |
| `id`, other fields | Not used |

**Constraint**: a profile must exist before scheduling. Missing profile → no schedule.

## Derived: IdleSchedule

| Field | Formula / meaning |
|-------|-------------------|
| `intervalMinutes` | `clamp((16 × 60) / dailyCigarettes, 30, 240)` |
| `scheduledAt` | `now + intervalMinutes × 60,000` |
| `title` | `Pausa consciente 🛑` |
| `body` | `¿Tienes ganas de fumar? Abre la app antes de encenderlo.` |
| `channelId` (Android) | `idle-reminders`, high importance, vibration, default sound |
| `pendingCount` | Exactly 0 or 1 |

**Edge rules**

- Daily average `<= 0` or invalid → interval 240.
- Interval is never below 30 or above 240.
- Only one pending idle notification may exist.
- Scheduling is attempted only after DB ready and a profile exists.

## Entity: NotificationPermissionState (derived)

| Value | Meaning |
|-------|---------|
| `granted` | Schedule/reschedule allowed |
| `denied` | No schedules; one non-blocking explanation |
| `undetermined` | Request permission on the next ready/reset attempt |

## Entity: IdleResetTrigger

| Trigger | Effect |
|---------|--------|
| App initial ready | Request permission; schedule if granted + profile |
| App becomes active/foreground | Cancel pending; schedule new |
| App becomes background | Cancel pending; schedule new |
| Confirmed postponement | Cancel pending; schedule new |
| Completed smoking session | Cancel pending; schedule new |

**No trigger**: Taps, screen navigation, badge unlocks, inventory edits, or other interactions that do not indicate a completed habit cycle.

## State transitions

```text
app_ready(profile)
  → permission_granted → cancel_pending → schedule(next interval) → one_pending
  → permission_denied  → cancel_pending → no_pending + one notice

one_pending
  → app_active/background → cancel → schedule → one_pending
  → postponed            → cancel → schedule → one_pending
  → session_completed    → cancel → schedule → one_pending
  → notification fires   → delivered (no pending remains until next reset)
```

## Out of scope

Remote push/FCM/APNs, backend scheduling, user-configurable intervals, multiple simultaneous reminders, quiet hours beyond the interval formula, and database changes.
