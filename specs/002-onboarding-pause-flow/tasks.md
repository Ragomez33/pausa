---

description: "Task list for Onboarding & Pause Button Flow"

---

# Tasks: Onboarding & Pause Button Flow

**Input**: Design documents from `/specs/002-onboarding-pause-flow/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Included selectively — the constitution (§5.6/§5.7) mandates unit tests for utilities,
validation, and mappers, so tests cover the zod schema, metric calculations, and event mapper.

**Organization**: Tasks are grouped by user story (P1→P3) to enable independent implementation/testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1, US2, US3
- Exact file paths are included in each task

## Path Conventions

- Thin router: `app/`
- Logic: `src/modules/<module>/`, `src/shared/`
- DB lives in `src/shared/db/` (constitution §1.1)

> **Constitution reminders**: no inline field validation — use `showAppToast` (code-rules §3/§7);
> constants out of components (§5); single form-state object (§6); atomic try/catch + pure helpers
> (§8); DESC ordering for event getters (§11); never hardcode metrics (FR-014).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Shared primitives used across all stories.

- [x] T001 [P] Create `src/shared/constants/app.ts` with `CIGARETTES_PER_PACK = 20` and `DEFAULT_CURRENCY`
- [x] T002 [P] Extend `src/shared/types/global.ts` with `TriggerEmotion` union, `HomeMetrics`, and `ProfileFormValues` types

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schema, migration, and data access required by every story.

**⚠️ CRITICAL**: No user story can be implemented until this phase is complete.

- [x] T003 Extend `src/shared/db/schema.ts`: add `dailyCigarettes`, `packCost`, `currency`, `quitGoal` to `user_profile`; add `pause_events` table with `createdAt` index and inferred types
- [x] T004 Regenerate the migration with `npm run db:generate` and confirm new files under `drizzle/`
- [x] T005 [P] Implement data helpers in `src/shared/db/queries.ts`: `getProfile`, `saveProfile`, `listPauseEvents` (DESC by `createdAt`), `createPauseEvent`
- [x] T006 [P] Confirm `src/shared/hooks/useDatabaseInitialized.ts` applies the new migration idempotently (no partial init)

**Checkpoint**: Schema + queries ready; stories can now proceed.

---

## Phase 3: User Story 1 - First-Run Onboarding Creates the Profile (Priority: P1) 🎯 MVP

**Goal**: A validated onboarding flow that persists the local profile and lands on home.

**Independent Test**: Launch with no profile → invalid submit blocked (toast) → valid submit saves profile and redirects to `/`.

- [x] T007 [US1] Create zod onboarding schema (`dailyCigarettes` > 0, `packCost` ≥ 0, `currency`, optional `quitGoal`) and inferred types in `src/modules/onboarding/utils/schema.ts`
- [x] T008 [P] [US1] Create onboarding constants (currency options, defaults) in `src/modules/onboarding/utils/constants.ts`
- [x] T009 [P] [US1] Create `buildProfileFromForm` mapper in `src/modules/onboarding/utils/mappers.ts`
- [x] T010 [US1] Implement `useOnboardingProfile` hook (load existing profile, validate, save, expose status) in `src/modules/onboarding/hooks/useOnboardingProfile.ts`
- [x] T011 [US1] Build the onboarding UI (single `formData` state, NativeWind dark palette, submit → save → `router.replace('/')`) in `src/modules/onboarding/views/OnboardingScreen.tsx`
- [x] T012 [US1] Ensure route `app/onboarding/index.tsx` stays thin (imports `OnboardingScreen` only)
- [x] T013 [P] [US1] Unit-test the zod schema (valid + invalid cases) in `src/modules/onboarding/tests/unit/schema.test.ts`

**Checkpoint**: Onboarding is fully functional and independently testable (MVP).

---

## Phase 4: User Story 2 - Home Dashboard with Dynamic Metrics and Pausa Button (Priority: P2)

**Goal**: Home screen with profile guard, central Pausa button, and metrics derived from stored data.

**Independent Test**: With a profile, home shows metrics matching stored events (zero-state when none) and the Pausa button navigates to `/pause`; without a profile, redirect to `/onboarding`.

- [x] T014 [P] [US2] Implement pure metric helpers (`resistedCount`, `currentStreak`, `moneySaved`) in `src/modules/dashboard/utils/metrics.ts`
- [x] T015 [P] [US2] Unit-test metric helpers (including zero/empty state) in `src/modules/dashboard/tests/unit/metrics.test.ts`
- [x] T016 [US2] Implement `useHomeMetrics` hook (profile existence + metrics from `queries.ts`, `refresh` on focus) in `src/modules/dashboard/hooks/useHomeMetrics.ts`
- [x] T017 [US2] Build the home UI (central "Pausa" button via `router.push('/pause')`, metric cards, dark NativeWind palette, `Redirect` to `/onboarding` when no profile) in `src/modules/dashboard/views/DashboardScreen.tsx`
- [x] T018 [US2] Ensure route `app/index.tsx` stays thin and renders `DashboardScreen`

**Checkpoint**: Home is functional and independently testable.

---

## Phase 5: User Story 3 - Record an Impulse Through the Pause Flow (Priority: P3)

**Goal**: Reflection timer → trigger chips → resisted/ceded outcome saved as a local `pause_events` row.

**Independent Test**: Open `/pause`, timer gates outcome, select trigger + outcome, event persisted and reflected on home; early exit persists nothing.

- [x] T019 [P] [US3] Create pause constants (`TRIGGER_OPTIONS` with label + value, default reflection duration) in `src/modules/pause/utils/constants.ts`
- [x] T020 [P] [US3] Create `buildPauseEvent` mapper in `src/modules/pause/utils/mappers.ts`
- [x] T021 [P] [US3] Unit-test `buildPauseEvent` in `src/modules/pause/tests/unit/mappers.test.ts`
- [x] T022 [US3] Implement `usePauseFlow` hook (interval-based reflection timer with cleanup, `isRunning`, trigger state, save via `createPauseEvent`, toast on error) in `src/modules/pause/hooks/usePauseFlow.ts`
- [x] T023 [US3] Build the pause UI (countdown display, disabled controls while running, trigger chips, "Logré pausar"/"Cedí" buttons) in `src/modules/pause/views/PauseScreen.tsx`
- [x] T024 [US3] Ensure route `app/pause/index.tsx` stays thin and renders `PauseScreen`

**Checkpoint**: Full impulse-recording loop works end-to-end.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validation, robustness, and repository hygiene.

- [x] T025 [P] Review empty/error states across screens and confirm all validation/errors use `showAppToast` with no inline field text
- [x] T026 Run `npm run typecheck` (0 errors) and `npm test` (all pass); fix any failures before proceeding
- [x] T027 Execute the `quickstart.md` scenarios and confirm all checklist items pass
- [x] T028 Git checkpoint: run `git status` and present a suggested commit message for user confirmation (do NOT commit/push automatically — constitution §5.9)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup (T001, T002).
- **US1 (Phase 3)**: Depends on Foundational (needs schema + `saveProfile`).
- **US2 (Phase 4)**: Depends on Foundational; independent of US1 for metric logic, but home redirect depends on profile existing (created by US1 or seeded directly).
- **US3 (Phase 5)**: Depends on Foundational (`createPauseEvent`); independent of US1/US2.
- **Polish (Phase 6)**: Depends on all stories.

### Story Completion Order

1. US1 (P1) — MVP.
2. US2 (P2) — can start after Foundational; best verified after US1 seeds a profile.
3. US3 (P3) — after Foundational.

### Parallel Opportunities

- Setup: T001, T002.
- Foundational: T005, T006.
- US1: T008, T009, T013.
- US2: T014, T015.
- US3: T019, T020, T021.

---

## Parallel Example: User Story 3

```bash
# After Foundational, launch independent US3 pieces together:
Task: "Create TRIGGER_OPTIONS + timer duration in src/modules/pause/utils/constants.ts"
Task: "Create buildPauseEvent mapper in src/modules/pause/utils/mappers.ts"
Task: "Unit-test buildPauseEvent in src/modules/pause/tests/unit/mappers.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Complete Phase 1 (Setup) + Phase 2 (Foundational).
2. Complete Phase 3 (US1).
3. **STOP and VALIDATE**: onboarding saves profile and redirects; `tsc` + tests pass.

### Incremental Delivery

1. Foundation → US1 (profile creation, MVP).
2. US2 (home + metrics + Pausa entry).
3. US3 (pause flow + event recording).
4. Polish + quickstart validation.

---

## Notes

- All tasks follow the strict checklist format: `- [ ] T### [P?] [US?] description + file path`.
- **Runtime note**: device-level verification (onboarding→home, pause timer, metrics refresh) requires a
  simulator/device; `tsc` (0 errors), `jest` (25/25), and the Android dev bundle were verified here.
- Tests cover pure logic (schema/metrics/mappers); UI is validated via `quickstart.md`.
- No network calls; all persistence via `src/shared/db/` (Drizzle/SQLite).
- Never commit/push without explicit user confirmation (constitution §5.9).
