# Tasks: Smart Idle Notifications

**Input**: Design documents from `/specs/009-idle-notifications/`

**Prerequisites**: `plan.md` (required), `spec.md` (required), `research.md`, `data-model.md`,
`contracts/` (`notifications.md`, `integration.md`), `quickstart.md`

**Tests**: Included because the project constitution (§5.2.6/§5.6) requires unit tests and the plan defines
a Jest strategy. Interval/schedule math and content constants are tested first; permissions, Android
channel, and delivery are validated through `quickstart.md`.

**Organization**: Tasks are grouped by user story (P1 → P3). Interval math is foundational; the single
scheduling service is US1 because it delivers the reminder itself.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: `[US1]`, `[US2]`, `[US3]` for user-story phases; omitted in Setup, Foundational, and Polish
- Every task includes the exact file path(s) it touches

## Path Conventions

- Mobile app with Expo Router: `app/` (thin routes), `src/shared/`, `src/modules/`.
- Tests: `src/shared/tests/unit/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the existing notification stack and identify the batch behavior to replace.

- [X] T001 [P] Verify `package.json` already includes `expo-notifications`; do not install new runtime libraries or remote-push packages.
- [X] T002 [P] Inspect `src/shared/utils/notifications.ts`, `src/shared/utils/reminderSchedule.ts`, `src/shared/hooks/useInactivityReminders.ts`, and `src/modules/dashboard/views/DashboardScreen.tsx` to confirm the obsolete batch API and its call sites.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Single-reminder interval and schedule math used by every story.

**⚠ CRITICAL**: Complete before user stories.

- [X] T003 [P] Update `src/shared/utils/reminderSchedule.ts`: keep `DEFAULT_WAKING_HOURS = 16`, set `MIN_REMINDER_INTERVAL_MINUTES = 30`, add `MAX_REMINDER_INTERVAL_MINUTES = 240`, implement `calculateIdleIntervalMinutes(dailyCigarettes, wakingHours = 16)` as `clamp(16*60/daily, 30, 240)` (zero/invalid → 240), and add `computeIdleSchedule(nowMs, dailyCigarettes)` returning `{ intervalMinutes, scheduledAtMs }`. Remove `buildReminderDates` and the waking-window start/end constants.
- [X] T004 [P] Update `src/shared/tests/unit/reminderSchedule.test.ts`: 20/day → 48 minutes; 40/day → 30-minute floor; 1/day → 240-minute ceiling; zero/negative/NaN → 240; `computeIdleSchedule` returns `now + interval`; invalid `nowMs` handled safely.

**Checkpoint**: Interval and schedule math ready.

---

## Phase 3: User Story 1 — Receive a Timely Idle Reminder (Priority: P1) 🎯 MVP

**Goal**: With permission and a profile, exactly one local reminder is scheduled at the calculated interval with the exact content and Android channel settings.

**Independent Test**: With 20 cigarettes/day and permission granted, initialize the app and verify one pending notification scheduled about 48 minutes ahead with the exact title/body and a high-importance Android channel.

### Implementation for User Story 1

- [X] T005 [US1] Rewrite `src/shared/utils/notifications.ts`: export `IDLE_NOTIFICATION_TITLE = 'Pausa consciente 🛑'`, `IDLE_NOTIFICATION_BODY = '¿Tienes ganas de fumar? Abre la app antes de encenderlo.'`, `scheduleIdleNotification(dailyCigarettes)`, `cancelIdleNotification()`, and `resetIdleNotificationFromProfile()`. Configure Android channel `idle-reminders` with `HIGH` importance, vibration `[0, 250, 250, 250]`, and `sound: 'default'`. Cancel only the pending `idle-reminder` identifier before scheduling one DATE trigger; serialize calls through a module-level promise chain; return `{ scheduled, permissionGranted, error }` and never throw. Remove `scheduleInactivityReminders`.
- [X] T006 [US1] Create `src/shared/hooks/useIdleNotifications.ts`: when `ready` and a profile exists, call `resetIdleNotificationFromProfile()`; expose no UI block; track whether a disabled notice has already been shown in the session.
- [X] T007 [US1] Integrate `useIdleNotifications(ready)` into `app/_layout.tsx` after `useDatabaseInitialized`, keeping `configureNotificationHandler` and not delaying the loading indicator or stack.
- [X] T008 [US1] Delete `src/shared/hooks/useInactivityReminders.ts` and remove its import/call from `src/modules/dashboard/views/DashboardScreen.tsx`; ensure no batch API remains in use.
- [X] T009 [US1] Run `npm run typecheck` and `npm test` (scripts in `package.json`); fix all errors before marking US1 complete.

**Checkpoint**: US1 works — permission-aware single reminder with exact content and channel.

---

## Phase 4: User Story 2 — Reset the Idle Timer After Meaningful Activity (Priority: P2)

**Goal**: App foreground/background, confirmed postponement, and completed sessions cancel the pending reminder and schedule exactly one new one.

**Independent Test**: Schedule a reminder, trigger each reset separately, and verify the previous notification is cancelled and exactly one new one is scheduled; rapid resets leave at most one pending.

### Implementation for User Story 2

- [X] T010 [US2] Add `AppState` listening in `src/shared/hooks/useIdleNotifications.ts` for `active` and `background` transitions: reset the reminder each time (only with a profile/permission), and clean up the subscription on unmount. Rapid transitions must not leave duplicates.
- [X] T011 [P] [US2] In `src/modules/awareness/hooks/useAwarenessLoop.ts`, call `resetIdleNotificationFromProfile()` fire-and-forget after a successful postponement only; do not reset on storage failure.
- [X] T012 [P] [US2] In `src/modules/smoking/hooks/useSmokingSession.ts`, call `resetIdleNotificationFromProfile()` fire-and-forget after a successful session record (including empty-inventory sessions); do not reset on failure.
- [X] T013 [US2] Run `npm run typecheck` and `npm test` (scripts in `package.json`); fix all errors before marking US2 complete.

**Checkpoint**: US1 and US2 work — resets are complete and non-blocking.

---

## Phase 5: User Story 3 — Handle Permission and Notification Failure Gracefully (Priority: P3)

**Goal**: Denied/revoked permission or scheduling failure leaves the app usable, cancels stale reminders, and explains the disabled state once.

**Independent Test**: Deny permission, verify no schedule and the app works with one notice; revoke permission after a reminder exists and verify no stale pending reminder remains; re-enable and confirm scheduling resumes on the next reset.

### Implementation for User Story 3

- [X] T014 [US3] In `src/shared/utils/notifications.ts` and `src/shared/hooks/useIdleNotifications.ts`, handle denial/revocation and scheduling failure: cancel pending reminders, return `{ scheduled: false, permissionGranted: false, error }`, show at most one non-blocking toast per app session, and resume scheduling after permission is granted later.
- [X] T015 [US3] Run `npm run typecheck` and `npm test` (scripts in `package.json`); fix all errors before marking US3 complete.

**Checkpoint**: All stories work — scheduling, resets, and failure states.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Cleanup, full validation, and governance.

- [X] T016 [P] Search `src/` and `app/` for `scheduleInactivityReminders`, `buildReminderDates`, `useInactivityReminders`, old 24-hour batch references, and hardcoded notification copy; remove leftovers.
- [X] T017 Run `npm run lint`, `npm run typecheck`, and `npm test` from `package.json`; confirm 0 errors and 0 failing tests.
- [ ] T018 Execute the scenarios in `specs/009-idle-notifications/quickstart.md` on a simulator/device (permission, channel, interval bounds, exact content, every reset trigger, rapid resets, denial/revocation, no profile/zero average, offline); record results.
  - _Status: blocked pending a simulator/device. Automated equivalents passed: lint, typecheck, and 131 Jest tests._
- [X] T019 Run `git status` for the repository root (`src/`, `app/`, `specs/009-idle-notifications/`), summarize changed files, and present the suggested commit command for user confirmation (constitution §5.9). Do NOT commit or push automatically.

---

## Phase 7: Session Notification Isolation

**Purpose**: Keep idle reminders and smoking-session prompts independent after the session-notification feature landed.

- [X] T020 Refactor idle cancellation to use the `idle-reminder` identifier/prefix only; remove every `cancelAllScheduledNotificationsAsync()` call.
- [X] T021 Suspend idle reminders while `active_smoking_session` has a row and resume them after the session finishes or is discarded.
- [X] T022 Add the `smoking-session` high-importance Android channel and `smoking-session:<sessionId>:<minutes>` identifiers in `src/shared/utils/notifications.ts`.
- [X] T023 Update `src/shared/tests/unit/notifications.test.ts` with session title/channel isolation and run lint, typecheck, and tests.

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup — blocks all stories.
- **US1 (Phase 3)**: Depends on Foundational.
- **US2 (Phase 4)**: Depends on US1 (same hook/service).
- **US3 (Phase 5)**: Depends on US1/US2 (error paths in the same service/hook).
- **Polish (Phase 6)**: Depends on all stories.

### Key Task Dependencies

- T003 → T004 → T005 → T006 → T007/T008 → T009.
- T005/T006 → T010 → T011/T012 → T013.
- T010 → T014 → T015.
- T017 → T018 → T019.

### Within Each Story

- Interval/schedule tests before service changes.
- Service before hook.
- Hook before lifecycle/reset integration.
- Run `tsc` + `jest` before closing a story.

---

## Parallel Opportunities

- **Setup**: T001, T002.
- **Foundational**: T003, T004.
- **US2**: T011 and T012 (different modules) once T005 is available.
- **Polish**: T016 is independent of the final checks.

### Parallel Example: Foundational

```text
Task: "Update interval and schedule helpers" (T003)
Task: "Update reminder schedule tests" (T004)
```

### Parallel Example: User Story 2

```text
Task: "Reset after postponement in awareness hook" (T011)
Task: "Reset after session completion in smoking hook" (T012)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Setup (T001–T002).
2. Complete Foundational (T003–T004).
3. Complete US1 (T005–T009).
4. **STOP and VALIDATE** with the US1 independent test.
5. Demo a single permission-aware idle reminder with exact content.

### Incremental Delivery

1. Setup + Foundational → interval/schedule math.
2. US1 → single reminder service, global hook, layout integration.
3. US2 → complete reset triggers and lifecycle handling.
4. US3 → denial/revocation/failure behavior.
5. Polish → cleanup, full checks, device validation, commit proposal.

### Parallel Team Strategy

1. Team completes Setup + Foundational together.
2. US1 must land first (service/hook ownership).
3. US2 reset integrations can be split by module once US1 exists.
4. US3 hardens the shared service/hook.

---

## Notes

- `[P]` marks different files with no dependency on an incomplete task.
- Story labels map to spec user stories.
- Tests are required by the constitution; update existing test files rather than creating versioned duplicates.
- No new runtime dependencies, no schema change, no network/remote push.
- Exactly one idle reminder may be pending; all scheduling paths must preserve that invariant.
- Mark each task `[X]` immediately after completion, and run `tsc` + `jest` before closing a story.
