# Tasks: History & Statistics

**Input**: Design documents from `/specs/006-history-statistics/`

**Prerequisites**: `plan.md` (required), `spec.md` (required), `research.md`, `data-model.md`,
`contracts/` (`database.md`, `routes.md`), `quickstart.md`

**Tests**: Included because the project constitution (§5.2.6/§5.6) requires unit tests and the plan defines
a Jest strategy. Pure analytics/labels/formatting are tested first; native aggregation queries and list
performance are validated through `quickstart.md`.

**Organization**: Tasks are grouped by user story (P1 → P3). Aggregation queries, trigger labels, and pure
analytics are foundational because all three stories depend on them.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: `[US1]`, `[US2]`, `[US3]` for user-story phases; omitted in Setup, Foundational, and Polish
- Every task includes the exact file path(s) it touches

## Path Conventions

- Mobile app with Expo Router: `app/` (thin routes), `src/modules/`, `src/shared/`, `src/db/`.
- Tests: `src/modules/<module>/tests/unit/` and `src/shared/tests/unit/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the feature reuses existing data and introduces no dependencies or migrations.

- [X] T001 [P] Verify `package.json` already lists `drizzle-orm`, `expo-sqlite`, `expo-router`, and `nativewind`; do not install new runtime libraries or charting packages.
- [X] T002 [P] Verify `src/db/schema.ts` and `src/db/queries.ts` already expose `pause_events` and `user_profile`; confirm no schema change or migration is needed for this read-only feature.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Aggregate queries, shared labels/formatting, and pure analytics used by every story.

**⚠ CRITICAL**: Complete before user stories.

- [X] T003 [P] Create `src/shared/constants/triggers.ts` with labels for the current codes (`anxiety` → Ansiedad, `stress` → Estrés, `boredom` → Aburrimiento, `habit_social` → Hábito/Social, `anger_frustration` → Ira/Frustración) plus legacy `work_stress` → Estrés laboral, `coffee_social` → Café/Social, and `other` → Otro.
- [X] T004 [P] Create `src/shared/utils/triggers.ts` with `getTriggerLabel(code: string): string`: return the mapped label, otherwise a readable title-cased fallback with underscores replaced by spaces (never a raw internal code). Add `formatDateTime(iso: string): string` to `src/shared/utils/utils.ts` using device locale/time zone with a raw-value fallback for invalid dates.
- [X] T005 [P] Create `src/shared/tests/unit/triggers.test.ts` covering current labels, legacy labels, unknown-code fallback, and raw-code avoidance; extend `src/shared/tests/unit/utils.test.ts` with `formatDateTime` valid/invalid cases.
- [X] T006 Update `src/db/queries.ts`: change `listPauseEvents()` to `ORDER BY timestamp DESC, id DESC`; add `getPauseTotals(): { total; resisted; ceded }` using `count()` plus conditional sums; add `listTriggerCounts(): { triggerEmotion; count }[]` using `GROUP BY trigger_emotion`; add `getLatestCededTimestamp(): string | null` using `MAX(timestamp) WHERE resisted = 0`. Export the result interfaces.
- [X] T007 [P] Create `src/modules/history/utils/analytics.ts` with `computeSuccessRate(resisted, total)` (zero-safe), `computeStreakStart(profileCreatedAt, latestCededTimestamp)` (later timestamp wins, invalid values fall back to 0), `computeStreakParts(elapsedMs)` (clamped, days/hours), `buildTriggerBreakdown(counts)` (percentage of total, count DESC then label tie-break), and `computePauseAnalytics(totals, counts, profileCreatedAt, latestCededTimestamp, nowMs)`. Export `TriggerBreakdown`, `PauseAnalytics`, and `PauseTotals`/`TriggerCount`-compatible types.
- [X] T008 [P] Create `src/modules/history/tests/unit/analytics.test.ts` covering: 3/1 → 75% success, zero total → 0, no events → zero analytics, streak from profile creation, streak reset by a later ceded timestamp, clock skew clamped to 0, days/hours split, trigger percentages, count ordering, and deterministic ties.

**Checkpoint**: Aggregates, labels, formatting, and analytics ready — stories can proceed.

---

## Phase 3: User Story 1 — Review Past Impulses (Priority: P1) 🎯 MVP

**Goal**: A dedicated history screen lists pause events newest first with localized date/time, trigger label, resisted/ceded status, and optional notes.

**Independent Test**: Seed a profile and several pause events with known timestamps, triggers, outcomes, and notes; open `/history` and confirm all rows appear in descending order with the correct labels, statuses, and notes, and that an empty dataset shows the empty state.

### Tests for User Story 1

- [X] T009 [P] [US1] Create `src/modules/history/tests/unit/mappers.test.ts` for `toHistoryEntry`: localized date/time, trigger label, outcome label (`Superado con éxito` / `Cedió`), trimmed notes, and `null` for blank notes.

### Implementation for User Story 1

- [X] T010 [P] [US1] Create `src/modules/history/utils/constants.ts` with outcome labels, empty-state copy, and section titles, plus `src/modules/history/utils/mappers.ts` with `toHistoryEntry(event: PauseEvent): HistoryEntry` using `formatDateTime`, `getTriggerLabel`, and trimmed notes.
- [X] T011 [US1] Create `src/modules/history/hooks/useHistory.ts`: load `getProfile()`, `listPauseEvents()`, `getPauseTotals()`, `listTriggerCounts()`, and `getLatestCededTimestamp()` on focus; build analytics with `computePauseAnalytics(...)`; expose `{ loading, hasProfile, events, analytics, error, refresh }`; handle storage errors and leave profile redirection to the screen.
- [X] T012 [US1] Create `src/modules/history/views/HistoryScreen.tsx`: loading indicator, error state, onboarding redirect when no profile, back action, and a virtualized `FlatList` of `toHistoryEntry` rows with stable id keys, a memoized row component, `ListEmptyComponent`, and a header title. Do not add statistics components yet.
- [X] T013 [US1] Create `app/history/index.tsx` rendering `HistoryScreen` and register `<Stack.Screen name="history" />` in `app/_layout.tsx`.
- [X] T014 [US1] Update `src/modules/dashboard/views/DashboardScreen.tsx` with a visible "Historial" action navigating to `/history`, keeping the existing Inventario and Pausa actions.
- [X] T015 [US1] Run `npm run typecheck` and `npm test` (scripts in `package.json`); fix all errors before marking US1 complete.

**Checkpoint**: US1 works independently — users can review their full pause history.

---

## Phase 4: User Story 2 — Understand Success and Current Streak (Priority: P2)

**Goal**: The history screen shows the overall success rate and the active smoke-free streak in days and hours.

**Independent Test**: With 3 resisted and 1 ceded event, the summary shows 75%; with no ceded event the streak starts at profile creation; after a recent ceded event it restarts there; zero events show a neutral success state.

### Implementation for User Story 2

- [X] T016 [P] [US2] Create `src/modules/history/views/StatsSummary.tsx` with two cards: success rate (`Sin datos` when total is 0, otherwise a rounded percentage) and active streak (`Nd Nh`). Accept `PauseAnalytics` as a prop and use NativeWind only.
- [X] T017 [US2] Integrate `StatsSummary` into the `ListHeaderComponent` of `src/modules/history/views/HistoryScreen.tsx`, above the event list, preserving the empty/loading/error behavior.
- [X] T018 [US2] Run `npm run typecheck` and `npm test` (scripts in `package.json`); fix all errors before marking US2 complete.

**Checkpoint**: US1 and US2 both work — history plus success rate and streak.

---

## Phase 5: User Story 3 — Identify Frequent Triggers (Priority: P3)

**Goal**: The history screen shows observed triggers with counts, percentages, and proportional native bars, sorted by frequency.

**Independent Test**: Seed 3 anxiety, 1 stress, and 0 boredom events; confirm anxiety shows 3/75% first with the longest bar, stress 1/25% second, boredom absent, and an empty state when there are no events.

### Implementation for User Story 3

- [X] T019 [P] [US3] Create `src/modules/history/views/TriggerBreakdown.tsx`: render observed triggers with label, count, rounded percentage, and a proportional horizontal bar (`count / maxCount * 100%`) using NativeWind plus a justified inline width style; show an empty state when the list is empty.
- [X] T020 [US3] Integrate `TriggerBreakdown` into the `ListHeaderComponent` of `src/modules/history/views/HistoryScreen.tsx` below `StatsSummary`; keep the list virtualization and existing states.
- [X] T021 [US3] Run `npm run typecheck` and `npm test` (scripts in `package.json`); fix all errors before marking US3 complete.

**Checkpoint**: All stories work — history, success/streak, and trigger patterns.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Cleanup, performance validation, and governance.

- [X] T022 [P] Search `src/` and `app/` for chart/canvas dependencies, raw trigger codes rendered in UI, in-component sorting, and hardcoded analytics; clean up.
- [X] T023 [P] Review `src/modules/history/views/HistoryScreen.tsx` and `TriggerBreakdown.tsx` for virtualization correctness (stable keys, memoized row), touch targets, contrast, and long-note wrapping.
- [X] T024 Run `npm run lint`, `npm run typecheck`, and `npm test` from `package.json`; confirm 0 errors and 0 failing tests.
- [ ] T025 Execute the scenarios in `specs/006-history-statistics/quickstart.md` on a simulator/device (empty history, ordering, success/streak, trigger breakdown, legacy codes, 1,000-event performance, navigation, failure state); record results.
  - _Status: blocked pending a simulator/device. Automated equivalents passed: lint, typecheck, and 109 Jest tests._
- [X] T026 Run `git status` for the repository root (`src/`, `app/`, `specs/006-history-statistics/`), summarize changed files, and present the suggested commit command for user confirmation (constitution §5.9). Do NOT commit or push automatically.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup — blocks all stories.
- **US1 (Phase 3)**: Depends on Foundational.
- **US2 (Phase 4)**: Depends on Foundational and US1 (uses the screen header).
- **US3 (Phase 5)**: Depends on Foundational, US1, and US2 (same header stack).
- **Polish (Phase 6)**: Depends on all stories.

### Key Task Dependencies

- T003/T004 → T005, T009/T010.
- T006/T007 → T008, T011.
- T010/T011 → T012 → T013/T014 → T015.
- T012 → T017 → T020.
- T016 → T017 → T018; T019 → T020 → T021.
- T024 → T025 → T026.

### Within Each Story

- Tests for pure helpers first, then implementation.
- Mappers before the screen.
- Hook before the screen.
- Run `tsc` + `jest` before closing a story.

---

## Parallel Opportunities

- **Setup**: T001, T002.
- **Foundational**: T003, T004, T005, T007, T008 (different files).
- **US1**: T009 and T010 can be written together; T011 follows analytics; T012 follows T011.
- **US2/US3**: T016 and T019 are independent components; integration into the same screen (T017/T020) is sequential.
- **Polish**: T022, T023.

### Parallel Example: Foundational

```text
Task: "Create trigger label constants in src/shared/constants/triggers.ts" (T003)
Task: "Create getTriggerLabel and formatDateTime helpers" (T004)
Task: "Create label/date tests" (T005)
Task: "Create pure history analytics" (T007)
Task: "Create analytics tests" (T008)
```

### Parallel Example: User Story 1

```text
Task: "Create history mapper tests" (T009)
Task: "Create history constants and toHistoryEntry mapper" (T010)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Setup (T001–T002).
2. Complete Foundational (T003–T008).
3. Complete US1 (T009–T015).
4. **STOP and VALIDATE** with the US1 independent test.
5. Demo/deploy the event history if ready.

### Incremental Delivery

1. Setup + Foundational → queries, labels, formatting, analytics.
2. US1 → newest-first event history (MVP).
3. US2 → success rate and active streak cards.
4. US3 → trigger frequency breakdown with native bars.
5. Polish → cleanup, full checks, device validation, commit proposal.

### Parallel Team Strategy

1. Team completes Setup + Foundational together.
2. US1 first (hook + screen + route).
3. US2 and US3 components can be developed in parallel once the screen header exists; integrate sequentially.

---

## Dashboard Secondary Metrics

- [X] T027 [P] Extend `src/modules/history/hooks/useHistory.ts` to load existing inventory logs and expose avoided cigarettes, money saved, inventory spending, and currency using shared calculation helpers; no SQLite/Drizzle query changes.
- [X] T028 [P] Extend `src/modules/history/views/StatsSummary.tsx` with avoided-cigarettes, money-saved, and inventory-spending cards, and pass the summary from `src/modules/history/views/HistoryScreen.tsx`.

---

## Notes

- `[P]` marks different files with no dependency on an incomplete task.
- Story labels map to spec user stories.
- Tests are required by the constitution; update existing test files rather than creating versioned duplicates.
- No new runtime dependencies, no schema change, and no network calls.
- Keep analytics derived and pure; never persist totals.
- Mark each task `[X]` immediately after completion, and run `tsc` + `jest` before closing a story.
