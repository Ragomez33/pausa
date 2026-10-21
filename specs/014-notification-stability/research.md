# Phase 0 Research: Notification Stability

## R1. Why session prompts arrived together

- **Decision**: Treat the batching as an OS-level exact-alarm/Doze issue, not a scheduling bug. Keep one alarm per boundary but add a foreground fallback and an exact-alarm guidance flow.
- **Rationale**: `expo-notifications` uses `AlarmManagerCompat.setExactAndAllowWhileIdle` only when `alarmManager.canScheduleExactAlarms()` is true; otherwise it falls back to inexact `setAndAllowWhileIdle`. On Android 12+/13+ with targetSdk 35, declaring `SCHEDULE_EXACT_ALARM` is not enough: the person must grant "Alarms & reminders". Inexact alarms are batched in Doze, which matches all prompts arriving at ~30 minutes.
- **Alternatives considered**: Custom native module (out of scope); switching to `expo-intent-launcher` (new dependency, native rebuild); polling in JS (does not run in background).

## R2. Exact-alarm verification API

- **Decision**: Detect Android API ≥ 31 through `Platform.Version` and show a one-time guidance toast. Do not attempt to read `canScheduleExactAlarms()`.
- **Rationale**: `expo-notifications` 0.32 does not export `canScheduleExactAlarmsAsync`, and there is no JS bridge to `AlarmManager`. The plan explicitly allows "manejo nativo para guiar al usuario"; the practical managed-workflow equivalent is guidance to system settings.
- **Alternatives considered**: Adding `expo-intent-launcher` to open `ACTION_REQUEST_SCHEDULE_EXACT_ALARM` directly; writing a config plugin/native module. Both require installation approval and a rebuild.

## R3. Idle repetition strategy

- **Decision**: Keep one non-repeating DATE trigger and re-arm deterministically: on foreground when missing, on background, and after real interactions. Use `ensure` (do not cancel) on foreground.
- **Rationale**: A repeating `TIME_INTERVAL` uses the same value for the initial delay and the repeat period, so it cannot be anchored to `lastInteraction + interval` without resetting the countdown. It would also fire while the person is actively using the app. Re-arming on every lifecycle transition removes the "single orphan shot" without duplicates.
- **Alternatives considered**: Repeating interval (loses the anchor, foreground noise); multiple future DATE triggers (violates the single-pending rule); background fetch (not available/reliable).

## R4. What counts as a real interaction

- **Decision**: `max(latest smoking event timestamp, latest pause-event timestamp)`, falling back to now when there is no history.
- **Rationale**: Both are intentional habit interactions already persisted in SQLite. Inventory consumption creates smoking events, so it is covered. Opening the app, navigating, or viewing screens is not.
- **Alternatives considered**: A new notification-state table (schema change); AsyncStorage (forbidden for domain data); module memory (lost on process death).

## R5. Orphan session threshold

- **Decision**: 30 minutes, reusing the stale-session threshold. Cleanup runs only at cold start (`ready` mount), never on every foreground.
- **Rationale**: At 30 minutes the UI already considers the session stale; a cold start cannot offer the stale dialog, so clearing it is the only way to unblock idle reminders. Restricting cleanup to cold start avoids deleting a session the person is currently viewing after a long smoke.
- **Alternatives considered**: 2–12 hours (reminders stay blocked longer); every foreground (can delete a live session).

## R6. Foreground session fallback

- **Decision**: Track the last announced 5-minute boundary. On `active`, recompute elapsed time, announce only the latest crossed boundary in a dismissible card, and re-schedule remaining prompts.
- **Rationale**: This satisfies the backup requirement without duplicating every missed OS notification. The OS remains the primary channel; the card is idempotent and capped at 60 minutes.
- **Alternatives considered**: Showing one card per missed boundary (noisy); relying only on the elapsed clock (no explicit prompt).

## R7. Testing strategy

- **Decision**: Unit-test pure math (`computeIdleScheduleFromAnchor`, boundary helpers, orphan classifier, exact-alarm detection) and the idle service with a mocked `expo-notifications`.
- **Rationale**: Native alarm behavior cannot run in Jest; anchors and idempotency can. Device behavior is covered in `quickstart.md`.
