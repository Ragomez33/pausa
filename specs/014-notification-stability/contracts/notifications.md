# Contract: Notification Service (amendments)

Amends `specs/009-idle-notifications/contracts/notifications.md` and the session-prompt contract from feature 008.

## Constants

```ts
export const IDLE_NOTIFICATION_DATA_TYPE = 'idle-reminder';
export const EXACT_ALARM_HINT_STATE_KEY = 'notification_exact_alarm_hint_shown';
export const ORPHAN_SESSION_MINUTES = 30;
export const ANDROID_EXACT_ALARM_MIN_API = 31;
```

## Idle service

```ts
export interface IdleScheduleInput {
  dailyCigarettes: number;
  lastInteractionAtMs: number;
  nowMs?: number;
}

export function scheduleIdleNotification(
  input: IdleScheduleInput,
): Promise<IdleScheduleResult>;

export function ensureIdleNotificationFromProfile(
  nowMs?: number,
): Promise<IdleScheduleResult>;

export function resetIdleNotificationFromProfile(): Promise<IdleScheduleResult>;

export function cancelIdleNotification(): Promise<void>;
```

### Requirements

- **C-001**: `scheduleIdleNotification` MUST target `lastInteractionAtMs + interval`; if that is not in the future, it MUST target `nowMs + interval`.
- **C-002**: The idle content MUST keep the exact 009 title/body and include `data: { type: 'idle-reminder' }`.
- **C-003**: `ensureIdleNotificationFromProfile` MUST NOT cancel an existing `idle-reminder`; it only schedules when none is pending. If permission was revoked, it MUST cancel any stale reminder and return `permissionGranted: false`.
- **C-004**: `resetIdleNotificationFromProfile` MUST cancel the existing `idle-reminder` and schedule from `getLatestHabitInteractionAtMs()`.
- **C-005**: All idle scheduling MUST remain serialized through the module queue and MUST leave at most one pending idle reminder.
- **C-006**: Cancellation MUST remain identifier/prefix-scoped; `cancelAllScheduledNotificationsAsync()` remains forbidden.

## Session prompts

- **C-007**: `computePromptBoundaryMinutes(startedAtMs, nowMs)` returns the latest multiple of 5 minutes, capped at 60.
- **C-008**: `resolveForegroundPromptMinutes(startedAtMs, lastAnnounced, nowMs)` returns a boundary only when it is greater than the last announced one.
- **C-009**: On `AppState === 'active'` during a session, remaining prompts MUST be re-scheduled with `scheduleSessionPrompts` (past boundaries skipped).

## Orphan sessions

- **C-010**: `isOrphanSmokingSession` MUST return true for sessions at/over 30 minutes, future timestamps, and non-finite values.
- **C-011**: Cold-start cleanup MUST delete the row and call `cancelSessionPrompts()`.
- **C-012**: Cleanup MUST NOT run on every foreground transition.

## Exact alarms

- **C-013**: `shouldGuideExactAlarmSetup` MUST be true only for `Platform.OS === 'android'` with API >= 31.
- **C-014**: The guidance MUST be shown at most once per installation, stored in `sync_state`, and only after notification permission is granted.
