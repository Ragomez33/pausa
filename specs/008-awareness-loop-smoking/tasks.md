# Tasks: Awareness Loop & Smoking Session

**Input**: Design documents from `/specs/008-awareness-loop-smoking/`

**Prerequisites**: `plan.md` (required), `spec.md` (required), `research.md`, `data-model.md`,
`contracts/` (`database.md`, `routes.md`), `quickstart.md`

**Tests**: Included because the project constitution (§5.2.6/§5.6) requires unit tests and the plan defines
a Jest strategy. Pure loop/message/reminder math is tested first; native timers and notifications are
validated through `quickstart.md`.

**Organization**: Tasks are grouped by user story (P1 → P4). Schema, queries, message bank, reminder
helpers, and notifications service are foundational because multiple stories depend on them.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: `[US1]`–`[US4]` for user-story phases; omitted in Setup, Foundational, and Polish
- Every task includes the exact file path(s) it touches

## Path Conventions

- Mobile app with Expo Router: `app/` (thin routes), `src/modules/`, `src/shared/`, `src/db/`, `drizzle/`.
- Tests: `src/modules/<module>/tests/unit/` and `src/shared/tests/unit/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the feature reuses installed capabilities and existing data.

- [X] T001 [P] Verify `package.json` already lists `expo-notifications`, `drizzle-orm`, `expo-sqlite`, `expo-router`, and `nativewind`; do not install new runtime libraries.
- [X] T002 [P] Verify `app/pause/index.tsx` renders the old PauseScreen, `src/db/schema.ts` has `user_profile`/`pause_events`/`inventory_logs`, and no `smoking_events`/`teams` tables exist yet.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schema, migration, queries, message bank, date/reminder helpers, and notification service.

**⚠ CRITICAL**: Complete before user stories.

- [X] T003 Add to `src/db/schema.ts`: `postponedCount` / `postponed_count` integer not null default 0 on `user_profile`; `smokingEvents` (`id`; `timestamp` text ISO not null; `triggerEmotion` text not null; `durationSeconds` integer not null; `inventoryDecremented` integer 0/1 not null) with timestamp index; `teams` (`id`, `name`, `goalLevel` in `facil|medio|dificil|modo_dios`, `durationDays`, `createdAt` ISO); `teamMembers` (`id`, `teamId` referencing teams, `localName`, `dailyLimit`, `status`) with team id index. Export all inferred types.
- [X] T004 Create `drizzle/0005_awareness_teams.sql`: `ALTER TABLE user_profile ADD postponed_count integer NOT NULL DEFAULT 0`; create `smoking_events`, `teams`, `team_members`, and indexes `idx_smoking_events_timestamp` / `idx_team_members_team_id`. Update `drizzle/meta/_journal.json` and `drizzle/migrations.js`; extend the bootstrap SQL in `src/shared/hooks/useDatabaseInitialized.ts` with the new tables/indexes; validate 0000–0005 with Node's `node:sqlite` including the default postponement count.
- [X] T005 Update `src/db/queries.ts`: `incrementPostponedCount()` atomic update + returning; `createSmokingEvent`, `listSmokingEvents()` DESC by timestamp, `countSmokingEventsBetween(startIso,endIso)` using `count()`/`between`; `listTeams`, `createTeam`, `listTeamMembers(teamId)`, `createTeamMember`. Export result types.
- [X] T006 [P] Create `src/shared/constants/messages.ts` with a bank of frank, realistic messages about smell, money, and habit (at least 8 entries).
- [X] T007 [P] Create `src/modules/awareness/utils/messages.ts` with `pickMessage(messages, previousIndex?)`: choose randomly, excluding the immediately previous index when more than one message exists. Add `src/modules/awareness/tests/unit/messages.test.ts` covering exclusion, single-message fallback, and valid indices.
- [X] T008 [P] Create `src/shared/utils/dayRange.ts` with `getLocalDayRange(nowMs): { startIso, endIso }` using local midnight boundaries. Add `src/shared/tests/unit/dayRange.test.ts` covering a normal day and midnight.
- [X] T009 [P] Create `src/shared/utils/reminderSchedule.ts` with `calculateReminderIntervalMinutes(dailyCigarettes, wakingHours=16)` = `max(30, wakingHours*60/dailyCigarettes)` (zero/invalid daily returns the minimum), and `buildReminderDates(nowMs, intervalMinutes, wakingStartHour=8, wakingEndHour=22)` returning the next 24-hour batch within waking hours. Add `src/shared/tests/unit/reminderSchedule.test.ts` covering interval clamp, waking-window bounds, and no dates outside the window.
- [X] T010 Update `src/shared/utils/notifications.ts`: export `INACTIVITY_MESSAGE = 'Tienes ganas de fumar? Abre la app antes de encenderlo.'`; add `scheduleInactivityReminders(dailyCigarettes)` that requests permission, configures the Android channel, cancels existing scheduled notifications, schedules the `buildReminderDates` batch with date triggers, and returns `{ scheduled, permissionGranted }`; add `cancelInactivityReminders()`. Failures return zero scheduled and do not throw.
- [X] T011 Create `src/shared/hooks/useInactivityReminders.ts`: read the profile on mount, call `scheduleInactivityReminders(profile.dailyCigarettes)` once, and expose a non-blocking status; do nothing when no profile exists or permission is denied. Show at most one informational toast when reminders are disabled.

**Checkpoint**: Schema, migration, queries, messages, date/reminder helpers, and notifications service ready.

---

## Phase 3: User Story 1 — Awareness Loop (Priority: P1) 🎯 MVP

**Goal**: Home's "Quiero fumar" action opens the postpone → emotion → message → session-start loop, with a single persisted postponement on "Sí".

**Independent Test**: Complete both branches from Home: "Sí" increments the postponement count once, shows a positive message, returns Home, and creates no session; "No" shows the four emotions, a bank message, and "Iniciar Cigarrillo".

### Implementation for User Story 1

- [X] T012 [P] [US1] Create `src/modules/awareness/utils/constants.ts` with the four emotions (`anxiety_stress` → Ansiedad/Estrés, `boredom` → Aburrimiento, `habit` → Costumbre, `social_pressure` → Presión Social), step copy, and a positive-postpone message.
- [X] T013 [US1] Create `src/modules/awareness/hooks/useAwarenessLoop.ts`: state for `step` (`postpone|emotion|message`), selected trigger, and message index (≤3 `useState`); `confirmPostpone()` calls `incrementPostponedCount` once using a guard ref, toasts positively, and returns true; `declinePostpone()` advances to emotion; `selectEmotion()` picks a message excluding the previous index; `startSession()` returns the trigger for navigation. Handle storage errors with a toast.
- [X] T014 [US1] Create `src/modules/awareness/views/AwarenessLoopScreen.tsx`: Step 1 "¿Puedes posponerlo?" with Sí/No; Step 2 the four emotion chips; Step 3 the frank message and "Iniciar Cigarrillo". On postpone success `router.replace('/')`; on start `router.push({ pathname: '/smoking-session', params: { trigger } })`. NativeWind/native primitives only.
- [X] T015 [US1] Change `app/pause/index.tsx` to render `AwarenessLoopScreen`; delete the obsolete `src/modules/pause` view/hook/schema/mappers/tests after confirming no remaining imports. Keep `pause_events` for historical history.
- [X] T016 [US1] Update `src/modules/dashboard/views/DashboardScreen.tsx` so the primary action label is "Quiero fumar" / "Tengo ganas de fumar" and navigates to `/pause`; preserve the existing secondary actions.
- [X] T017 [US1] Run `npm run typecheck` and `npm test` (scripts in `package.json`); fix all errors before marking US1 complete.

**Checkpoint**: US1 works independently — the awareness loop and postponement branch are functional.

---

## Phase 4: User Story 2 — Smoking Session (Priority: P2)

**Goal**: A live session timer, five-minute "¿Terminaste?" prompts, exact duration recording, inventory decrement, and today's smoked count.

**Independent Test**: Start a session, let it pass five minutes, choose "Seguir", then "Terminé"; verify exact seconds, one-cigarette decrement, and today's counter. Abandon another session and verify nothing is recorded.

### Tests for User Story 2

- [X] T018 [P] [US2] Create `src/modules/smoking/tests/unit/session.test.ts` for duration formatting (`mm:ss`/`h:mm:ss`), prompt boundary calculation, minimum one-second duration, and smoking-event mapping with ISO timestamp/trigger/flags.
- [X] T019 [P] [US2] Extend `src/modules/dashboard/tests/unit/metrics.test.ts` for `smokedToday` and `dailyLimit` in `HomeMetrics` (limit from profile, default zero safe).

### Implementation for User Story 2

- [X] T020 [P] [US2] Create `src/modules/smoking/utils/session.ts` with `formatDuration(seconds)`, `nextPromptBoundary(elapsedSeconds)`, and `buildSmokingEvent({ timestamp, triggerEmotion, durationSeconds, inventoryDecremented })`.
- [X] T021 [US2] Create `src/modules/smoking/utils/service.ts` with `completeSmokingSession({ triggerEmotion, durationSeconds, nowMs })`: compute stock from inventory logs, insert the smoking event and (when stock > 0) a one-cigarette consumption log inside a `db.transaction`, return `{ inventoryDecremented, error }`; never throw to the screen.
- [X] T022 [US2] Create `src/modules/smoking/hooks/useSmokingSession.ts`: wall-clock `startedAtRef`, one-second interval recomputing elapsed seconds, prompt visibility at each 300-second boundary, `continueSession()` hides the prompt, and `finishSession()` uses a synchronous guard to call `completeSmokingSession` once.
- [X] T023 [US2] Create `src/modules/smoking/views/SmokingSessionScreen.tsx`: live timer, persistent "Terminé" action, and a native `Modal` prompt "¿Terminaste?" with "Seguir"/"Terminé" every five minutes. On success replace to `/` with a positive confirmation; empty inventory shows a clear notice.
- [X] T024 [US2] Create `app/smoking-session/index.tsx` rendering `SmokingSessionScreen` and register `<Stack.Screen name="smoking-session" />` in `app/_layout.tsx`; read the trigger route parameter with a safe `habit` fallback.
- [X] T025 [US2] Update `src/shared/types/global.ts` `HomeMetrics` with `smokedToday` and `dailyLimit`; update `src/modules/dashboard/utils/metrics.ts` `computeHomeMetrics(..., smokedToday = 0)` to return them.
- [X] T026 [US2] Update `src/modules/dashboard/hooks/useHomeMetrics.ts` to query `countSmokingEventsBetween(getLocalDayRange(now))` and pass it into `computeHomeMetrics`; update `src/modules/dashboard/views/DashboardScreen.tsx` with a "Hoy: X / límite" card.
- [X] T027 [US2] Run `npm run typecheck` and `npm test` (scripts in `package.json`); fix all errors before marking US2 complete.

**Checkpoint**: US1 and US2 work — the loop can start a session and completion updates local data.

---

## Phase 5: User Story 3 — Local Inactivity Reminders (Priority: P3)

**Goal**: Schedule profile-based local reminders with the exact required message, permission handling, and deduplication.

**Independent Test**: With a profile and permission granted, Home triggers reminders whose interval matches `max(30, 16×60/daily)` and whose message is exact; reopening creates no duplicates; denying permission leaves the app usable.

### Implementation for User Story 3

- [X] T028 [US3] Integrate `useInactivityReminders()` into `src/modules/dashboard/views/DashboardScreen.tsx` so scheduling runs after the profile is available without blocking render; ensure no duplicate schedules and a single non-blocking notice when reminders are disabled.
- [X] T029 [US3] Run `npm run typecheck` and `npm test` (scripts in `package.json`); fix all errors before marking US3 complete.

**Checkpoint**: US3 works independently — reminders are local, correctly spaced, and permission-aware.

---

## Phase 6: User Story 4 — Team Foundation & Ranking Stub (Priority: P4)

**Goal**: Store team/member data and show the ranking stub with the three requested labels.

**Independent Test**: Inspect stored team/member fields and open `/team`: the three rank labels appear and an empty state is shown when no teams exist.

### Implementation for User Story 4

- [X] T030 [US4] Update `src/modules/team/views/TeamScreen.tsx` with an empty-state/team-count summary from `listTeams()` and static ranking stub sections for "El Guardián", "El Inquebrantable", and "El Resiliente". Use NativeWind/native primitives; no network calls.
- [X] T031 [US4] Run `npm run typecheck` and `npm test` (scripts in `package.json`); fix all errors before marking US4 complete.

**Checkpoint**: All stories are functional — loop, session, reminders, and team foundation.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Cleanup, accessibility, full validation, and governance.

- [X] T032 [P] Search `src/` and `app/` for stale old-pause references, unused breathing/message code, hardcoded reminder intervals, raw emotion codes in UI, and dead imports; clean up.
- [X] T033 [P] Review `AwarenessLoopScreen`, `SmokingSessionScreen`, and `TeamScreen` for touch targets, contrast, timer readability, prompt accessibility, and long-message wrapping.
- [X] T034 Run `npm run lint`, `npm run typecheck`, and `npm test` from `package.json`; confirm 0 errors and 0 failing tests.
- [ ] T035 Execute the scenarios in `specs/008-awareness-loop-smoking/quickstart.md` on a simulator/device (both branches, five-minute prompt, finish/duplicate/abandoned session, empty inventory, notifications/permissions/dedupe, team stub); record results.
  - _Status: blocked pending a simulator/device. Automated equivalents passed: lint, typecheck, 127 Jest tests, and a real SQLite migration test for 0000–0005._
- [X] T036 Run `git status` for the repository root (`src/`, `app/`, `drizzle/`, `specs/008-awareness-loop-smoking/`), summarize changed files, and present the suggested commit command for user confirmation (constitution §5.9). Do NOT commit or push automatically.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup — blocks all stories.
- **US1 (Phase 3)**: Depends on Foundational.
- **US2 (Phase 4)**: Depends on Foundational; the session can be opened directly for independent testing.
- **US3 (Phase 5)**: Depends on Foundational and Home (US2 for the final Home integration).
- **US4 (Phase 6)**: Depends on Foundational.
- **Polish (Phase 7)**: Depends on all stories.

### Key Task Dependencies

- T003 → T004/T005; T004/T005 → T010/T013/T021.
- T006/T007 → T013/T014.
- T008/T009/T010 → T011/T028.
- T012 → T013 → T014 → T015/T016 → T017.
- T018/T020 → T021 → T022 → T023 → T024 → T027.
- T024/T025 → T026 → T027.
- T028 → T029; T030 → T031.
- T034 → T035 → T036.

### Within Each Story

- Tests for pure helpers first, then implementation.
- Schema/queries before services.
- Services before hooks/screens.
- Run `tsc` + `jest` before closing a story.

---

## Parallel Opportunities

- **Setup**: T001, T002.
- **Foundational**: T003, T006, T007, T008, T009 (different files).
- **US1**: T012 (constants) and T013 (hook) can start together; T014 follows.
- **US2**: T018/T019 (tests), T020 (session utils) in parallel; T021 follows.
- **Polish**: T032, T033.

### Parallel Example: Foundational

```text
Task: "Add schema tables and postponed column" (T003)
Task: "Create the frank message bank" (T006)
Task: "Create and test message picker" (T007)
Task: "Create and test local day range" (T008)
Task: "Create and test reminder schedule helpers" (T009)
```

### Parallel Example: User Story 2

```text
Task: "Create session formatting/mapping tests" (T018)
Task: "Extend HomeMetrics tests" (T019)
Task: "Create session utils" (T020)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Setup (T001–T002).
2. Complete Foundational (T003–T011).
3. Complete US1 (T012–T017).
4. **STOP and VALIDATE** with the US1 independent test.
5. Demo the awareness loop + postponement branch.

### Incremental Delivery

1. Setup + Foundational → schema, messages, reminders, notification service.
2. US1 → awareness loop and postponement (MVP).
3. US2 → smoking session, inventory, daily counts.
4. US3 → local inactivity reminders.
5. US4 → team foundation and ranking stub.
6. Polish → cleanup, full checks, device validation, commit proposal.

### Parallel Team Strategy

1. Team completes Setup + Foundational together.
2. US1 and US4 can proceed in parallel (different modules).
3. US2 follows the schema/queries; US3 follows the notification service.

---

## Notes

- `[P]` marks different files with no dependency on an incomplete task.
- Story labels map to spec user stories.
- Tests are required by the constitution; update existing test files rather than creating versioned duplicates.
- No new runtime dependencies, no network calls, no heavy graphics.
- Inventory stays derived from logs; the session and consumption write are atomic.
- Mark each task `[X]` immediately after completion, and run `tsc` + `jest` before closing a story.
