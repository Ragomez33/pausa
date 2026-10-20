# Tasks: Home Metrics & Pause Impulse Logging

**Input**: Design documents from `/specs/004-home-pause-impulse-logging/`

**Prerequisites**: `plan.md` (required), `spec.md` (required), `research.md`, `data-model.md`,
`contracts/` (`database.md`, `routes.md`), `quickstart.md`

**Tests**: Included because the project constitution (§5.2.6/§5.6) requires unit tests for implemented
tasks and the plan defines a Jest strategy. Pure business math is tested first; timer/animation behavior
is validated through `quickstart.md` on a device.

**Organization**: Tasks are grouped by user story (P1 → P3). No schema migration is needed; the existing
`src/db/` layer is reused.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: `[US1]`, `[US2]`, `[US3]` for user-story phases; omitted in Setup, Foundational, and Polish
- Every task includes the exact file path(s) it touches

## Path Conventions

- Mobile app with Expo Router: `app/` (thin routes), `src/modules/<module>/`, `src/shared/`, `src/db/`.
- Tests: `src/modules/<module>/tests/unit/` and `src/shared/tests/unit/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the existing project already supports the feature without new dependencies or
schema changes.

- [X] T001 [P] Verify `package.json` already lists `drizzle-orm`, `expo-sqlite`, `expo-router`, `zod`, and `nativewind`; do not install new runtime libraries.
- [X] T002 [P] Verify `src/db/schema.ts` and `src/db/queries.ts` already expose `user_profile` (`daily_cigarettes`, `pack_cost`, `currency`, `created_at`), `pause_events` (`timestamp`, `trigger_emotion`, `resisted`, `notes`), `createPauseEvent`, and DESC `listPauseEvents`; no migration is required.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared type and constant changes required by all stories.

**⚠ CRITICAL**: Complete before user stories.

- [X] T003 [P] Update `src/shared/types/global.ts`: replace `TriggerEmotion` with `'anxiety' | 'stress' | 'boredom' | 'habit_social' | 'anger_frustration'`, and replace `HomeMetrics` with `{ resistedCount: number; cededCount: number; elapsedMs: number; streakStart: string; avoidedCigarettes: number; moneySaved: number; currency: string }`. Remove `currentStreak` from `HomeMetrics`.
- [X] T004 [P] Update `src/modules/pause/utils/constants.ts`: `REFLECTION_DURATION_SECONDS = 12`; `NOTES_MAX_LENGTH = 200`; `TRIGGER_OPTIONS` exactly `{ anxiety, 'Ansiedad' }`, `{ stress, 'Estrés' }`, `{ boredom, 'Aburrimiento' }`, `{ habit_social, 'Hábito/Social' }`, `{ anger_frustration, 'Ira/Frustración' }`. Keep the app type-checking after the type change.

**Checkpoint**: Types and constants ready — stories can proceed.

---

## Phase 3: User Story 1 — See Progress and Savings on Home (Priority: P1) 🎯 MVP

**Goal**: Home shows elapsed streak time, avoided cigarettes, money saved, and lifetime resisted/ceded counts, all derived from stored records and refreshed while visible.

**Independent Test**: Seed a known profile and set of pause events, open home, and verify all four metrics match manual calculations; change the records and confirm they update on focus; wait 30 seconds and confirm elapsed/derived values tick.

### Tests for User Story 1

- [X] T005 [P] [US1] Expand `src/modules/dashboard/tests/unit/metrics.test.ts`: streak start uses profile `created_at`; a later ceded event resets it; resisted events do not reset it; `elapsedMs` is never negative (including future/invalid timestamps); `avoidedCigarettes = dailyCigarettes * elapsedMs / 86_400_000` with `0` when daily is `<= 0`; `moneySaved = (avoidedCigarettes / 20) * packCost` with `0` when pack cost is `<= 0`; resisted/ceded lifetime counts; deterministic `nowMs`.
- [X] T006 [P] [US1] Add tests for `formatElapsedDuration` in `src/shared/tests/unit/utils.test.ts`: zero/negative → `0m`; minutes/hours; multi-day output; no `NaN` for invalid input.

### Implementation for User Story 1

- [X] T007 [P] [US1] Rewrite `src/modules/dashboard/utils/metrics.ts` with pure helpers: `parseTimestamp`, `resolveStreakStart(profile, events)`, `computeElapsedMs`, `computeAvoidedCigarettes`, `computeMoneySaved`, `countResisted`, `countCeded`, and `computeHomeMetrics(profile, events, nowMs)`. Keep `formatMoney`. Do not use `Date.now()` inside pure functions.
- [X] T008 [P] [US1] Add `formatElapsedDuration(elapsedMs: number): string` to `src/shared/utils/utils.ts`; clamp negative/invalid values and return compact output such as `3d 4h 12m`, `2h 5m`, or `0m`.
- [X] T009 [US1] Update `src/modules/dashboard/hooks/useHomeMetrics.ts`: load profile and events, call `computeHomeMetrics(profile, events, Date.now())`, keep `useFocusEffect` loading, add a 30-second interval while focused that recomputes with a fresh `now`, clear it on blur/unmount, and preserve `refresh`, `error`, and `hasProfile`.
- [X] T010 [US1] Update `src/modules/dashboard/views/DashboardScreen.tsx`: render four metric cards — elapsed time (`formatElapsedDuration`), avoided cigarettes (max one decimal), money saved (`formatMoney`), and resisted vs. ceded counts. Keep the prominent central Pausa button navigating to `/pause` and the existing loading/error/profile guard.
- [X] T011 [US1] Run `npm run typecheck` and `npm test` (scripts in `package.json`); fix all errors before marking US1 complete.

**Checkpoint**: US1 is independently functional — home metrics are accurate and live.

---

## Phase 4: User Story 2 — Pause Before Acting on an Impulse (Priority: P2)

**Goal**: The Pausa button opens a 10–15 second breathing intervention that prevents outcome selection until the countdown completes; the five requested triggers and an optional notes field are available afterward.

**Independent Test**: From home, open `/pause`, confirm the countdown and breathing visual run for 10–15 seconds, outcome actions stay disabled, and leaving mid-countdown stores nothing; after completion, the five triggers, notes input, and outcome actions are available.

### Tests for User Story 2

- [X] T012 [P] [US2] Create `src/modules/pause/tests/unit/schema.test.ts` covering the pause form schema: accepts the five trigger codes (`anxiety`, `stress`, `boredom`, `habit_social`, `anger_frustration`); rejects missing/unknown triggers; trims notes; accepts empty notes; rejects notes longer than 200 characters.

### Implementation for User Story 2

- [X] T013 [P] [US2] Create `src/modules/pause/utils/schema.ts` with a Zod schema validating `triggerEmotion` against the five codes and `notes` as a trimmed string of max 200 characters; export the inferred type.
- [X] T014 [US2] Update `src/modules/pause/hooks/usePauseFlow.ts`: keep countdown and saving as separate state; consolidate `selectedTrigger` + `notes` into one `form` state object (3 `useState` total); expose `selectTrigger`, `setNotes`, `selectedTrigger`, `notes`, `secondsRemaining`, `isRunning`, `saving`, and `saveOutcome`; validate with the new schema; block saves while `secondsRemaining > 0`, when no trigger is selected, or when notes exceed the limit; use a synchronous `savingRef` guard in addition to `saving`; pass trimmed notes (empty → `null`) to `buildPauseEvent`.
- [X] T015 [US2] Update `src/modules/pause/views/PauseScreen.tsx`: add a smooth breathing visual using React Native `Animated` (scale/opacity loop, `useNativeDriver: true`) started while the countdown runs and stopped at zero/unmount; show the countdown; render the five trigger chips; render a multiline `TextInput` for notes with `maxLength={200}` and placeholder; keep both outcome actions disabled until the countdown completes and while saving.
- [X] T016 [US2] Run `npm run typecheck` and `npm test` (scripts in `package.json`); fix all errors before marking US2 complete.

**Checkpoint**: US2 is independently functional — users can pause, breathe, and prepare an outcome without saving yet.

---

## Phase 5: User Story 3 — Record the Impulse and Return with Feedback (Priority: P3)

**Goal**: Saving stores exactly one pause event, resets the streak on a ceded outcome, returns home, refreshes metrics, and shows a reinforcing confirmation.

**Independent Test**: Complete the intervention with each trigger and both outcomes; confirm one row per save with trigger, outcome, ISO timestamp, and notes; confirm home updates and shows the matching reinforcement banner.

### Tests for User Story 3

- [X] T017 [P] [US3] Update `src/modules/pause/tests/unit/mappers.test.ts`: new trigger codes map unchanged; notes are preserved; empty notes remain `null`; `resisted` maps to 1/0; `timestamp` is ISO.
- [X] T018 [P] [US3] Create `src/modules/dashboard/tests/unit/feedback.test.ts` covering `getFeedbackMessage('resisted' | 'ceded' | undefined)`: resisted returns a reinforcing message, ceded returns a supportive restart message, undefined returns `null`.

### Implementation for User Story 3

- [X] T019 [P] [US3] Create `src/modules/dashboard/utils/feedback.ts` with `getFeedbackMessage(feedback: string | undefined): string | null`; keep the two messages in `src/modules/dashboard/utils/constants.ts` if needed by code-rules §5.
- [X] T020 [US3] Update `src/modules/pause/views/PauseScreen.tsx`: on success call `router.replace({ pathname: '/', params: { feedback: resisted ? 'resisted' : 'ceded' } })`; on failure stay on the screen and rely on the existing error toast; ensure the save guard prevents a second insert.
- [X] T021 [US3] Update `src/modules/dashboard/views/DashboardScreen.tsx`: read `feedback` with `useLocalSearchParams`, display a dismissible inline reinforcement banner (resisted vs. ceded message), auto-hide after about 5 seconds, and keep it from blocking the Pausa button. Do not persist the feedback param.
- [X] T022 [US3] Confirm `useHomeMetrics` focus refresh runs after `router.replace('/')` so new events appear immediately; adjust `src/modules/dashboard/hooks/useHomeMetrics.ts` only if needed.
- [X] T023 [US3] Run `npm run typecheck` and `npm test` (scripts in `package.json`); fix all errors before marking US3 complete.

**Checkpoint**: All stories are functional — events persist once, home refreshes, and feedback is shown.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Cleanup, full validation, and governance.

- [X] T024 [P] Search `src/` and `app/` for stale `currentStreak`, old selectable trigger codes (`work_stress`, `coffee_social`, `other`), hardcoded metric values, and unused imports; remove or update them (historical trigger strings in data remain allowed).
- [X] T025 [P] Review `src/modules/pause/views/PauseScreen.tsx` for accessibility/readability basics: minimum touch targets, readable contrast, and no inline validation text.
- [X] T026 Run `npm run lint`, `npm run typecheck`, and `npm test` from `package.json`; confirm 0 errors and 0 failing tests.
- [ ] T027 Execute the scenarios in `specs/004-home-pause-impulse-logging/quickstart.md` on a simulator/device (home math, countdown gating, both outcomes, duplicate taps, zero values, error state); record results.
  - _Status: blocked pending a simulator/device. Automated equivalents passed: typecheck, lint, and 62 Jest tests._
- [X] T028 Run `git status` for the repository root (`src/`, `app/`, `specs/004-home-pause-impulse-logging/`), summarize changed files, and present the suggested commit command for user confirmation (constitution §5.9). Do NOT commit or push automatically.
- [X] T029 [P] Add `DASHBOARD_NAV_ITEMS` and nav icon metadata in `src/modules/dashboard/utils/navigation.ts`, metric accent styles in `src/modules/dashboard/utils/constants.ts`, and a centralized `src/shared/components/icons.ts` bridge importing icons from the public `lucide-react-native` root entry; keep pure feedback constants free of React Native icon imports so Jest keeps loading them.
- [X] T030 [US1] Update `src/modules/dashboard/views/DashboardScreen.tsx` with active/inactive navigation for Inicio, Historial, Inventario, Logros, and Equipo; this early pill implementation was later replaced by the fixed `MainTabBar` in T038–T039.
- [X] T031 [US1] Restyle `src/modules/dashboard/views/DashboardScreen.tsx` with high-contrast neon-bordered cards, a glowing streak hero, and an intervention-style "Quiero fumar" surface replacing the flat green circle; keep all metric values and navigation to `/pause` unchanged.
- [X] T032 [US1] Run `npx tsc --noEmit`, `npm run lint`, and `npm test`; confirm 0 type errors, 0 lint errors, and 163 passing tests.

---

## Phase 7: Dashboard Focus Revision

**Purpose**: Reduce the home screen to the two essential metrics and one central action, move secondary metrics to History, and remove filler copy.

- [X] T033 [P] [US1] Simplify `src/modules/dashboard/views/DashboardScreen.tsx` to show only the current-streak card and a compact today summary of resisted/ceded counts; remove avoided-cigarettes, money-saved, inventory-spending, and pack cards.
- [X] T034 [US1] Replace the wide intervention surface in `src/modules/dashboard/views/DashboardScreen.tsx` with a large `rounded-full` brand-orange circle centered in the available screen space, using a cigarette icon and white bold "Quiero fumar" text with no interior subtitle.
- [X] T035 [US1] Remove the four filler phrases from `src/modules/dashboard/views/DashboardScreen.tsx`: "Menos humo, más control. Un día a la vez.", "¿Aparece un impulso?", "Respira primero. La decisión puede esperar.", and "Activa una pausa de 12 segundos...".
- [X] T036 [US1] Surface avoided cigarettes, money saved, and inventory spending in `src/modules/history/hooks/useHistory.ts` and `src/modules/history/views/StatsSummary.tsx` using existing local queries and shared calculation helpers; do not alter SQLite/Drizzle logic.
- [X] T037 [US1] Run `npx tsc --noEmit`, `npm run lint`, and `npm test`; confirm the centered layout, metrics, and calculations remain correct.
- [X] T038 [P] [US1] Create `src/shared/constants/tabs.ts` and `src/shared/components/MainTabBar.tsx` with five equal-width fixed tabs and no horizontal ScrollView.
- [X] T039 [US1] Use `MainTabBar` on `/`, `/history`, `/inventory`, `/badges`, and `/team`; remove redundant "Volver" controls from those main views while keeping back navigation on team create/join/detail sub-screens.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup — blocks all stories.
- **US1 (Phase 3)**: Depends on Foundational; no dependency on US2/US3.
- **US2 (Phase 4)**: Depends on Foundational; can run in parallel with US1 (different files).
- **US3 (Phase 5)**: Depends on US1 (feedback banner in dashboard) and US2 (save flow in pause screen); must follow both.
- **Polish (Phase 6)**: Depends on all stories.

### Key Task Dependencies

- T003/T004 → T005, T007, T009, T010, T014.
- T005/T007/T008 → T009/T010 → T011.
- T012/T013 → T014 → T015 → T016.
- T014/T015 → T020; T019 → T021.
- T009/T010 → T021/T022.
- T026 → T027 → T028.

### Within Each Story

- Tests for pure helpers first, then implementation.
- Constants/schema before hooks.
- Hooks before views.
- Run `tsc` + `jest` before closing a story.

---

## Parallel Opportunities

- **Setup**: T001, T002.
- **Foundational**: T003, T004.
- **US1**: T005, T006 (tests) and T007, T008 (pure helpers) can run in parallel; T009 follows T007/T008; T010 follows T009.
- **US2**: T012 and T013 can run in parallel; T014 follows T013; T015 follows T014.
- **US3**: T017, T018, T019 can run in parallel; T020 follows T015; T021 follows T019/T010.
- **Polish**: T024/T025 are independent.

### Parallel Example: User Story 1

```text
Task: "Expand metric formula tests in src/modules/dashboard/tests/unit/metrics.test.ts" (T005)
Task: "Add duration formatting tests in src/shared/tests/unit/utils.test.ts" (T006)
Task: "Rewrite pure metric helpers in src/modules/dashboard/utils/metrics.ts" (T007)
Task: "Add formatElapsedDuration in src/shared/utils/utils.ts" (T008)
```

### Parallel Example: User Story 2

```text
Task: "Create pause form schema tests in src/modules/pause/tests/unit/schema.test.ts" (T012)
Task: "Create pause form schema in src/modules/pause/utils/schema.ts" (T013)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Setup (T001–T002).
2. Complete Foundational (T003–T004).
3. Complete US1 (T005–T011).
4. **STOP and VALIDATE** with the US1 independent test.
5. Demo/deploy the read-only progress dashboard if ready.

### Incremental Delivery

1. Setup + Foundational → types and constants ready.
2. US1 → accurate live home metrics (MVP).
3. US2 → breathing intervention, triggers, notes, countdown gating.
4. US3 → persistence, streak reset, home refresh, reinforcement feedback.
5. Polish → cleanup, full checks, device validation, commit proposal.

### Parallel Team Strategy

1. Team completes Setup + Foundational together.
2. Once Foundational is done:
   - Developer A: US1 (dashboard math and UI).
   - Developer B: US2 (pause schema/hook/view).
3. Developer A or B completes US3 after both stories integrate.
4. Polish shared.

---

## Notes

- `[P]` marks different files with no dependency on an incomplete task.
- Story labels map to spec user stories.
- Tests are required by the constitution; update existing tests rather than creating versioned duplicates.
- No new runtime dependencies and no database migration.
- Keep all metrics derived from SQLite; never hardcode or persist them.
- Mark each task `[X]` immediately after completion, and run `tsc` + `jest` before closing a story.
