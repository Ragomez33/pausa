# Tasks: Notification Stability and Robustness

**Feature**: `014-notification-stability` | **Status**: Implemented

## Phase 1 — Pure helpers

- [x] T001 Add `computeIdleScheduleFromAnchor` to `src/shared/utils/reminderSchedule.ts`.
- [x] T002 Add `src/shared/utils/orphanSession.ts` with `isOrphanSmokingSession` and `ORPHAN_SESSION_MINUTES = 30`.
- [x] T003 Add `src/shared/utils/exactAlarms.ts` with `shouldGuideExactAlarmSetup` and `openSystemNotificationSettings`.
- [x] T004 Add `computePromptBoundaryMinutes` and `resolveForegroundPromptMinutes` to `src/shared/utils/sessionPromptSchedule.ts`.
- [x] T005 Add idle data type and exact-alarm hint constants to `src/shared/constants/notifications.ts`.

## Phase 2 — Persistence reads

- [x] T006 Add `getLatestPauseEventTimestamp` and `getLatestHabitInteractionAtMs` to `src/db/queries.ts` (no schema change).

## Phase 3 — Idle service

- [x] T007 Refactor `scheduleIdleNotification` to accept `{ dailyCigarettes, lastInteractionAtMs, nowMs }` and anchor the DATE trigger.
- [x] T008 Add `data: { type: 'idle-reminder' }` to idle content.
- [x] T009 Add `ensureIdleNotificationFromProfile` that never cancels a pending reminder and verifies permission read-only.
- [x] T010 Reimplement `resetIdleNotificationFromProfile` with the anchored task and DB-derived anchor.
- [x] T011 Keep all scheduling serialized and identifier-scoped.

## Phase 4 — Lifecycle

- [x] T012 Rewrite `useIdleNotifications`: `ensure` on startup/foreground, `reset` on background.
- [x] T013 Release orphan sessions only on cold start and cancel their session prompts.
- [x] T014 Persist and show the exact-alarm guidance once per installation, only when permission is granted.

## Phase 5 — Session foreground fallback

- [x] T015 Track the last announced boundary and recompute elapsed time on `AppState === 'active'`.
- [x] T016 Re-schedule remaining session prompts on foreground.
- [x] T017 Expose `foregroundPromptMinutes` and `dismissForegroundPrompt` from `useSmokingSession`.
- [x] T018 Render the dismissible card in `SmokingSessionScreen`.

## Phase 6 — Tests and validation

- [x] T019 Add anchor tests to `reminderSchedule.test.ts`.
- [x] T020 Add boundary tests to `sessionPromptSchedule.test.ts`.
- [x] T021 Add `orphanSession.test.ts`.
- [x] T022 Add `exactAlarms.test.ts`.
- [x] T023 Add `idleNotifications.test.ts` (anchored DATE, passed target, ensure idempotency).
- [x] T024 Update mocks in `sessionNotifications.test.ts`.
- [x] T025 Run `npx tsc --noEmit`, `npx expo lint`, `npm test`.

## Phase 7 — Documentation

- [x] T026 Create `specs/014-notification-stability/*`.
- [x] T027 Add amendments to `specs/009-idle-notifications/*`.
- [x] T028 Reference the amendment in `specs/008-awareness-loop-smoking/tasks.md`.
