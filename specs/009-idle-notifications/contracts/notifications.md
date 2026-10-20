# Contract: Idle Notification Service

Local-only service using the device notification capability. No remote push/backend.

## Modules

- `src/shared/utils/reminderSchedule.ts` — interval formula.
- `src/shared/utils/notifications.ts` — permissions, channels, scheduling/cancel by identifier.
- `src/shared/utils/sessionPromptSchedule.ts` — session notification identifiers/prefixes.
- `src/shared/hooks/useIdleNotifications.ts` — global lifecycle integration and session suspension.
- `app/_layout.tsx` — calls the global hook after DB readiness and routes session notification taps.
- `src/modules/awareness/hooks/useAwarenessLoop.ts` — reset after postponement.
- `src/modules/smoking/hooks/useSmokingSession.ts` — session scheduling/cancel and idle reset after finishing or discarding.

## Constants

```ts
export const IDLE_NOTIFICATION_TITLE = 'Pausa consciente 🛑';
export const IDLE_NOTIFICATION_BODY =
  '¿Tienes ganas de fumar? Abre la app antes de encenderlo.';
export const IDLE_NOTIFICATION_CHANNEL_ID = 'idle-reminders';
export const IDLE_NOTIFICATION_ID = 'idle-reminder';
export const MIN_REMINDER_INTERVAL_MINUTES = 30;
export const MAX_REMINDER_INTERVAL_MINUTES = 240;
export const DEFAULT_WAKING_HOURS = 16;
```

## Exposed functions

```ts
export function calculateIdleIntervalMinutes(
  dailyCigarettes: number,
  wakingHours = DEFAULT_WAKING_HOURS,
): number;

export interface IdleScheduleResult {
  scheduled: boolean;
  permissionGranted: boolean;
  error: Error | null;
}

export async function scheduleIdleNotification(
  dailyCigarettes: number,
): Promise<IdleScheduleResult>;

export async function cancelIdleNotification(): Promise<void>;

export async function resetIdleNotificationFromProfile(): Promise<IdleScheduleResult>;
```

## Requirements

- **R-IDLE-1**: Interval MUST be `clamp(16×60/daily, 30, 240)`; invalid/zero daily → 240.
- **R-IDLE-2**: Scheduling MUST cancel only the pending idle identifier (`idle-reminder`) first and leave exactly one idle reminder pending on success. It MUST NOT cancel session notifications.
- **R-IDLE-3**: Title and body MUST match the constants exactly.
- **R-IDLE-4**: Android MUST use channel `idle-reminders` with high importance, vibration pattern `[0, 250, 250, 250]`, and default sound.
- **R-IDLE-5**: Permission MUST be requested only when not already granted; denial returns `permissionGranted: false` and no schedule.
- **R-IDLE-6**: Concurrent reset calls MUST be serialized; at most one idle schedule remains.
- **R-IDLE-7**: Scheduling failures MUST return an error, leave no duplicate/stale idle reminder, and never throw to the UI.
- **R-IDLE-8**: No profile → no schedule (return `scheduled: false`, `permissionGranted` unchanged).
- **R-IDLE-9**: All work MUST be async and must not block initial render.
- **R-IDLE-10**: No network, FCM, APNs, or server-side scheduling.
- **R-IDLE-11**: WHILE `active_smoking_session` has a row, the system MUST cancel pending idle reminders and MUST NOT schedule a new one.
- **R-IDLE-12**: `cancelAllScheduledNotificationsAsync()` MUST NOT be used; cancellation is identifier/prefix-scoped.

## Reset integration

- `useIdleNotifications(ready)`:
  - on ready with profile: request permission + schedule;
  - listen to `AppState` changes; reset on `active` and `background`;
  - suspend/cancel idle reminders while an active smoking session row exists;
  - show one informational toast per app session when reminders are disabled.
- `useAwarenessLoop.confirmPostpone` calls `resetIdleNotificationFromProfile()` after a successful increment.
- `useSmokingSession.finishSession` calls `resetIdleNotificationFromProfile()` after a successful completion or discard.
- Session notifications use the `smoking-session:` prefix and the `smoking-session` channel; idle cancellation never touches them.
