# Phase 0 Research: Smart Idle Notifications

Format per decision: **Decision / Rationale / Alternatives considered**.

## R1. Replace the reminder batch with one idle reminder

- **Decision**: Remove the 24-hour batch scheduling introduced in feature 008 and replace it with a single reset-aware idle notification. `scheduleIdleNotification` cancels the pending reminder and schedules exactly one for the next calculated interval. Remove the obsolete `useInactivityReminders` hook and its Dashboard call.
- **Rationale**: The spec explicitly asks for one idle notification that resets after interactions. Keeping both would produce duplicate or overlapping reminders. The shared interval formula is retained with new bounds.
- **Alternatives considered**: Keeping the batch (duplicates); running both modes behind a setting (scope creep); multiple pending idle reminders (violates the single-pending requirement).

## R2. Interval calculation and bounds

- **Decision**: `calculateIdleIntervalMinutes(dailyCigarettes, wakingHours = 16)` returns `clamp((16 * 60) / dailyCigarettes, 30, 240)`. Zero, negative, or invalid daily values return 240. The existing `MIN_REMINDER_INTERVAL_MINUTES` becomes 30 and a new `MAX_REMINDER_INTERVAL_MINUTES = 240` is added. `buildReminderDates` is removed.
- **Rationale**: Matches the 20/day → 48-minute example and prevents spam or multi-day silence. A single formula keeps the service and tests simple.
- **Alternatives considered**: No maximum (a 1/day profile would wait 16 hours); no minimum (heavy smokers would get spam); keeping the batch date builder (unused).

## R3. Permissions and Android channel

- **Decision**: Request permission once when the app is ready/profile exists. On Android, create a channel `idle-reminders` with `AndroidImportance.HIGH`, a vibration pattern, and `sound: 'default'`. Request only if not already granted; if denied, do not schedule and show one non-blocking informational toast per session.
- **Rationale**: Matches FR-001/FR-007/FR-011/FR-017. High importance, vibration, and sound make the reminder noticeable without a remote backend.
- **Alternatives considered**: Prompting on every app open (annoying); using the default importance channel (fails the spec); blocking the app when denied (unacceptable).

## R4. Scheduling mechanics and serialization

- **Decision**: `scheduleIdleNotification(dailyCigarettes)`:
  1. requests/checks permission;
  2. configures the Android channel;
  3. cancels all scheduled app notifications (the app owns only idle reminders);
  4. schedules one notification with a DATE trigger at `now + interval` and the exact title/body.
  All scheduling calls are serialized through a module-level promise chain so rapid reset triggers cannot interleave and leave duplicates. `cancelIdleNotification()` cancels pending reminders.
- **Rationale**: FR-015 requires at most one pending reminder. Cancelling before scheduling plus serialization prevents races from fast foreground/postpone/session events. The app has no other scheduled notifications, so cancel-all is safe.
- **Alternatives considered**: Tracking a single notification id (more state, still needs cancel on permission change); not serializing (race can leave two schedules); repeating time-interval trigger (cannot be precisely reset).

## R5. Reset triggers and global integration

- **Decision**: Add `src/shared/hooks/useIdleNotifications.ts` and call it from `app/_layout.tsx` after the database is ready:
  - request permission and schedule on initial ready with a profile;
  - reset on `AppState` `active` (app open/foreground) and `background` (leave one pending reminder);
  - expose `resetIdleNotificationFromProfile()` for explicit resets.
  Call the explicit reset after a successful postponement in `useAwarenessLoop` and after a successful session in `useSmokingSession`.
- **Rationale**: Covers every required trigger in one place while keeping the loop/session modules free of scheduling details. The layout is the app-level integration point requested by the spec.
- **Alternatives considered**: Resetting only from Home focus (misses background/foreground and other screens); putting AppState listeners in multiple modules (duplicate schedules); remote push (out of scope).

## R6. Error handling and permission revocation

- **Decision**: `scheduleIdleNotification` returns `{ scheduled: boolean; permissionGranted: boolean; error: Error | null }` and never throws. Scheduling failure returns `scheduled: false` with the error. If permission is revoked, the next reset attempt returns `permissionGranted: false` and cancels any stale pending reminder.
- **Rationale**: FR-011/FR-012/FR-017. The app must remain usable regardless of notification state, and stale reminders must not survive a revocation.
- **Alternatives considered**: Throwing to the caller (would complicate the global hook); silently ignoring stale schedules (violates the spec); clearing permissions programmatically (not allowed).

## R7. Content and constants

- **Decision**: Export `IDLE_NOTIFICATION_TITLE = 'Pausa consciente 🛑'` and `IDLE_NOTIFICATION_BODY = '¿Tienes ganas de fumar? Abre la app antes de encenderlo.'` from the notification service; use them in scheduling. Show the exact strings in tests.
- **Rationale**: Centralizes the required copy (code-rules §5) and makes the contract verifiable.
- **Alternatives considered**: Hardcoding in the service call (duplication); changing the copy per platform (fails the exact contract).

## R8. Path and architecture

- **Decision**: Keep the service at `src/shared/utils/notifications.ts` and pure schedule math at `src/shared/utils/reminderSchedule.ts`; add the global hook at `src/shared/hooks/useIdleNotifications.ts`. The requested `src/services/notifications.ts` path is superseded by the constitution's shared-utility structure and the existing notification ownership.
- **Rationale**: Avoids duplicate notification handlers and keeps shared infrastructure under `src/shared`, consistent with feature 008.
- **Alternatives considered**: Moving the service to `src/services` (splits ownership, violates code-rules §5); a module-specific service (notifications are app-wide).

## R9. Testing strategy

- **Decision**: Unit-test the interval formula and clamping, the scheduled date calculation, exact title/body constants, and the serialization/no-duplicate behavior at the pure level where possible. Notification delivery, Android channel settings, and permission prompts are validated on device via `quickstart.md`.
- **Rationale**: Native scheduling cannot be exercised in Jest; pure math and copy can. Race behavior is validated through repeated reset scenarios on device.
- **Alternatives considered**: Mocking expo-notifications (brittle); no tests (violates constitution §5.6).

## Resolved unknowns

All Technical Context fields are resolved; no `NEEDS CLARIFICATION` markers remain. Spec Clarification Gates are resolved by R1 (batch replacement), R2 (bounds), and R5 (reset triggers).
