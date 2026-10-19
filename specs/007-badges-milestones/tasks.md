# Tasks: Badges & Milestones

**Input**: Design documents from `/specs/007-badges-milestones/`

**Prerequisites**: `plan.md` (required), `spec.md` (required), `research.md`, `data-model.md`,
`contracts/` (`database.md`, `routes.md`), `quickstart.md`

**Tests**: Included because the project constitution (§5.2.6/§5.6) requires unit tests and the plan defines
a Jest strategy. Catalog/evaluator math is tested first; persistence and UI feedback are validated through
`quickstart.md` on a device.

**Organization**: Tasks are grouped by user story (P1 → P3). The table, shared metrics, catalog, and pure
evaluator are foundational because all three stories depend on them.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: `[US1]`, `[US2]`, `[US3]` for user-story phases; omitted in Setup, Foundational, and Polish
- Every task includes the exact file path(s) it touches

## Path Conventions

- Mobile app with Expo Router: `app/` (thin routes), `src/modules/`, `src/shared/`, `src/db/`, `drizzle/`.
- Tests: `src/modules/<module>/tests/unit/` and `src/shared/tests/unit/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the feature reuses existing data and introduces no dependencies.

- [X] T001 [P] Verify `package.json` already lists `drizzle-orm`, `expo-sqlite`, `expo-router`, and `nativewind`; do not install new runtime libraries or graphics packages.
- [X] T002 [P] Verify `src/db/queries.ts` already exposes `getProfile`, `getPauseTotals`, `getLatestCededTimestamp`, and `listPauseEvents`; confirm `src/db/schema.ts` has no `user_badges` table yet.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: New table, shared metrics, static catalog, and pure evaluator required by all stories.

**⚠ CRITICAL**: Complete before user stories.

- [X] T003 [P] Add `userBadges` to `src/db/schema.ts`: `id` integer PK autoincrement; `badgeKey` / `badge_key` text not null; `unlockedAt` / `unlocked_at` text ISO not null; add unique index `idx_user_badges_badge_key` on `badge_key`; export `UserBadge` and `NewUserBadge`.
- [X] T004 Create `drizzle/0004_user_badges.sql` with `CREATE TABLE user_badges` and `CREATE UNIQUE INDEX idx_user_badges_badge_key`; add the journal entry in `drizzle/meta/_journal.json` and register the import in `drizzle/migrations.js`. Validate migrations 0000–0004 with Node's `node:sqlite`, including rejection of a duplicate badge key.
- [X] T005 Update `src/db/queries.ts`: add `listUserBadges()` ordered DESC by `unlocked_at` and `unlockBadges(entries: { badgeKey: string; unlockedAt: string }[]): void` that no-ops on an empty list and batch-inserts with `onConflictDoNothing({ target: userBadges.badgeKey })`.
- [X] T006 [P] Create `src/shared/utils/derivedMetrics.ts` with `DAY_MS`, `parseIsoTimestamp`, `resolveStreakStartMs(profileCreatedAt, latestCededTimestamp)`, `computeElapsedMs`, `computeAvoidedCigarettes`, and `computeMoneySaved`. Use the values/formulas already used by Home and History.
- [X] T007 Refactor `src/modules/dashboard/utils/metrics.ts` and `src/modules/history/utils/analytics.ts` to use `src/shared/utils/derivedMetrics.ts` while preserving existing exports/tests; run `npm run typecheck` and `npm test` to confirm no regression.
- [X] T008 [P] Create `src/modules/badges/utils/catalog.ts` with exactly six definitions: `first_pause` (resisted pauses target 1), `five_pauses` (target 5), `1_day_clean` (streak days target 1), `1_week_clean` (target 7), `1_month_clean` (target 30), `money_saver_10` (savings target 10). Each has key, title, description, condition type, target, and unit.
- [X] T009 [P] Create `src/modules/badges/utils/evaluate.ts` with `BadgeState`, `BadgeStatus`, `evaluateBadges(state, unlockedKeys)`: build catalog order, mark unlocked keys, compute `progressValue = min(max(value, 0), target)` and `progressPercent = min(100, max(0, value / target * 100))`, and return eligible `newKeys` for locked badges whose value meets the target. Ignore unknown stored keys.
- [X] T010 [P] Create `src/modules/badges/tests/unit/evaluate.test.ts` covering catalog uniqueness/order, each of the six conditions, progress caps at 100 and floor at 0, zero-state, existing unlocked keys producing no new keys, and unknown keys being ignored.

**Checkpoint**: Table, migration, queries, shared metrics, catalog, and evaluator ready — stories can proceed.

---

## Phase 3: User Story 1 — See Achievements and Progress (Priority: P1) 🎯 MVP

**Goal**: A dedicated achievements screen shows all six catalog badges exactly once, with unlocked badges displaying their date and locked badges showing muted progress.

**Independent Test**: Seed a profile and manually seed unlocked records, open `/badges`, and verify all six badges render once with the correct unlocked/locked states, unlock dates, and progress values.

### Implementation for User Story 1

- [X] T011 [US1] Create `src/modules/badges/utils/service.ts` with `evaluateAndUnlockBadges(nowMs)` returning `{ newBadges, error }`: read `getProfile()`, `getPauseTotals()`, `getLatestCededTimestamp()`, and `listUserBadges()`; build `BadgeState` using shared derived metrics; call `evaluateBadges`; persist missing keys via `unlockBadges` with one ISO timestamp; return newly unlocked catalog definitions. Return an error instead of throwing.
- [X] T012 [US1] Create `src/modules/badges/hooks/useBadges.ts`: load profile, unlocked records, and current state on focus; build statuses with `evaluateBadges`; expose `{ loading, hasProfile, statuses, unlockedCount, error, refresh }`. Do not add evaluation/persistence or toast yet.
- [X] T013 [US1] Create `src/modules/badges/views/BadgesScreen.tsx`: loading/error/profile guard, back action, unlocked count, and six cards. Unlocked cards use an accent style, marker, and localized unlock date; locked cards are muted and show `progressValue / target unit` plus a proportional progress bar. Use NativeWind/native primitives only.
- [X] T014 [US1] Create `app/badges/index.tsx` rendering `BadgesScreen` and register `<Stack.Screen name="badges" />` in `app/_layout.tsx`.
- [X] T015 [US1] Update `src/modules/dashboard/views/DashboardScreen.tsx` with a visible "Logros" action navigating to `/badges`, keeping the existing Historial, Inventario, and Pausa actions.
- [X] T016 [US1] Run `npm run typecheck` and `npm test` (scripts in `package.json`); fix all errors before marking US1 complete.

**Checkpoint**: US1 works independently — users can browse the full badge catalog and progress.

---

## Phase 4: User Story 2 — Unlock Milestones Automatically (Priority: P2)

**Goal**: Eligible milestones are persisted automatically on Home focus and on the badges screen, exactly once, including retroactive unlocks.

**Independent Test**: Start with no unlocks, seed activity that meets several conditions, open Home and `/badges`, and confirm eligible badges are stored once with timestamps; repeat evaluation and confirm no duplicates or timestamp changes.

### Implementation for User Story 2

- [X] T017 [US2] Create `src/modules/badges/hooks/useBadgeEvaluation.ts`: run `evaluateAndUnlockBadges(Date.now())` on focus, expose the latest `newBadges`/`error` without showing a toast yet, and keep the hook safe to call on every Home focus.
- [X] T018 [US2] Integrate evaluation: call `useBadgeEvaluation()` in `src/modules/dashboard/views/DashboardScreen.tsx`, and call `evaluateAndUnlockBadges` before loading statuses in `src/modules/badges/hooks/useBadges.ts` (then refresh statuses). Preserve idempotency and existing error handling.
- [X] T019 [US2] Run `npm run typecheck` and `npm test` (scripts in `package.json`); fix all errors before marking US2 complete.

**Checkpoint**: US1 and US2 work — the gallery is accurate and eligible badges unlock automatically.

---

## Phase 5: User Story 3 — Recognize New Achievements (Priority: P3)

**Goal**: Newly unlocked badges produce one lightweight confirmation naming them; no confirmation appears when nothing unlocks.

**Independent Test**: Trigger unlocks from Home and from the badges screen; confirm a toast naming the new badges appears once, and revisiting without new unlocks shows nothing.

### Tests for User Story 3

- [X] T020 [P] [US3] Create `src/modules/badges/tests/unit/feedback.test.ts` for `formatUnlockMessage(newBadges)`: one badge names it, multiple badges lists them, and an empty list returns `null`.

### Implementation for User Story 3

- [X] T021 [P] [US3] Create `src/modules/badges/utils/feedback.ts` with `formatUnlockMessage(newBadges: BadgeDefinition[]): string | null`; return `null` for no badges and a readable list otherwise.
- [X] T022 [US3] Integrate feedback: in `src/modules/badges/hooks/useBadgeEvaluation.ts` and `src/modules/badges/hooks/useBadges.ts`, call `showAppToast({ title: '¡Nuevo logro!', description: message, action: 'success' })` only when `formatUnlockMessage` returns a message. Do not repeat on later evaluations.
- [X] T023 [US3] Run `npm run typecheck` and `npm test` (scripts in `package.json`); fix all errors before marking US3 complete.

**Checkpoint**: All stories work — collection, automatic unlocking, and one-time recognition.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Cleanup, accessibility, full validation, and governance.

- [X] T024 [P] Search `src/` and `app/` for duplicate badge keys, hardcoded progress formulas outside the shared/evaluator helpers, unused graphics dependencies, and stale `user_badges` references; clean up.
- [X] T025 [P] Review `src/modules/badges/views/BadgesScreen.tsx` for touch targets, contrast, long-description wrapping, and clear locked/unlocked differentiation.
- [X] T026 Run `npm run lint`, `npm run typecheck`, and `npm test` from `package.json`; confirm 0 errors and 0 failing tests.
- [ ] T027 Execute the scenarios in `specs/007-badges-milestones/quickstart.md` on a simulator/device (empty collection, first/five pauses, time thresholds, savings, idempotency, unknown keys, failure state); record results.
  - _Status: blocked pending a simulator/device. Automated equivalents passed: lint, typecheck, 121 Jest tests, and a real SQLite migration test for 0000–0004 including duplicate rejection._
- [X] T028 Run `git status` for the repository root (`src/`, `app/`, `drizzle/`, `specs/007-badges-milestones/`), summarize changed files, and present the suggested commit command for user confirmation (constitution §5.9). Do NOT commit or push automatically.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup — blocks all stories.
- **US1 (Phase 3)**: Depends on Foundational.
- **US2 (Phase 4)**: Depends on Foundational and US1 (uses the service/hooks/screen).
- **US3 (Phase 5)**: Depends on US1/US2 (consumes new-unlock results).
- **Polish (Phase 6)**: Depends on all stories.

### Key Task Dependencies

- T003 → T004/T005; T004 → runtime/new installs.
- T006 → T007 → T009/T011.
- T008 → T009 → T010.
- T005/T009/T011 → T012 → T013 → T014/T015 → T016.
- T017 → T018 → T019.
- T020/T021 → T022 → T023.
- T026 → T027 → T028.

### Within Each Story

- Evaluator/catalog tests before persistence.
- Service before hooks.
- Hooks before screen integration.
- Run `tsc` + `jest` before closing a story.

---

## Parallel Opportunities

- **Setup**: T001, T002.
- **Foundational**: T003, T006, T008, T009, T010 (different files).
- **US1**: T011/T012/T013 are sequential; T014 and T015 can follow.
- **US3**: T020 and T021 can be written together before integration T022.
- **Polish**: T024, T025.

### Parallel Example: Foundational

```text
Task: "Add userBadges schema and unique index" (T003)
Task: "Create shared derived-metric helpers" (T006)
Task: "Create the six-badge catalog" (T008)
Task: "Create the pure badge evaluator" (T009)
Task: "Create evaluator/catalog tests" (T010)
```

### Parallel Example: User Story 3

```text
Task: "Create feedback formatting tests" (T020)
Task: "Create formatUnlockMessage helper" (T021)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Setup (T001–T002).
2. Complete Foundational (T003–T010).
3. Complete US1 (T011–T016).
4. **STOP and VALIDATE** with the US1 independent test.
5. Demo/deploy the badge gallery if ready.

### Incremental Delivery

1. Setup + Foundational → table, shared metrics, catalog, evaluator.
2. US1 → badge gallery with progress (MVP).
3. US2 → automatic/retroactive unlocking on Home and badges focus.
4. US3 → one-time unlock feedback.
5. Polish → cleanup, full checks, device validation, commit proposal.

### Parallel Team Strategy

1. Team completes Setup + Foundational together.
2. US1 builds the service/hooks/screen.
3. US2 adds evaluation triggers, then US3 adds feedback (same hooks; sequential).

---

## Notes

- `[P]` marks different files with no dependency on an incomplete task.
- Story labels map to spec user stories.
- Tests are required by the constitution; update existing test files rather than creating versioned duplicates.
- No new runtime dependencies, no network calls, no heavy graphics.
- Unlocked badges are immutable and unique; evaluation must stay idempotent.
- Mark each task `[X]` immediately after completion, and run `tsc` + `jest` before closing a story.
