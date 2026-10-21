# Contract: App Lifecycle Integration

Thin integration points; no new routes.

## App root

- **R-LIFE-1**: `app/_layout.tsx` MUST call `useIdleNotifications(ready)` so permission and scheduling occur after the database is ready.
- **R-LIFE-2**: Notification setup MUST NOT delay or block the loading indicator or first screen.
- **R-LIFE-3**: The notification handler must remain configured once at mount (existing behavior).
- **R-LIFE-4**: No duplicate AppState listeners may be registered across remounts; cleanup MUST remove subscriptions.

## Home

- **R-LIFE-5**: Home no longer schedules the old batch; any old hook usage MUST be removed.

## Awareness loop

- **R-LIFE-6**: After a postponement is persisted successfully, the idle reminder MUST be reset without blocking navigation home.
- **R-LIFE-7**: A failed postponement MUST NOT reset the timer.

## Smoking session

- **R-LIFE-8**: After a session is recorded successfully, the idle reminder MUST be reset.
- **R-LIFE-9**: A failed session record MUST NOT reset the timer.
- **R-LIFE-10**: Empty-inventory sessions still reset the timer because the session was recorded.

## Background/foreground

- **R-LIFE-11**: AppState `active` and `background` transitions MUST cancel the pending reminder and schedule a new one when permission and profile allow.
- **R-LIFE-12**: Rapid transitions MUST leave at most one pending reminder.

## Deep-linking

No new routes. Existing `pausa://` behavior is unchanged.

---

## Amendment 2026-10-21 — Feature 014

- **R-LIFE-11 is superseded**: `active` MUST use `ensureIdleNotificationFromProfile()` and MUST NOT cancel or restart a pending reminder. `background` MUST use `resetIdleNotificationFromProfile()` anchored to the last real interaction.
- **R-LIFE-13**: Cold start MUST release an orphan `active_smoking_session` (≥ 30 minutes, invalid, or future) and cancel pending `smoking-session:` prompts.
- **R-LIFE-14**: On Android 12+ the app MUST show one exact-alarm guidance message per installation, after permission is granted.
- **R-LIFE-15**: During an active session, returning to the foreground MUST recompute elapsed time, surface the latest crossed 5-minute boundary, and re-schedule remaining prompts.

