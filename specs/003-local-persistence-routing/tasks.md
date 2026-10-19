# Tasks: Local Persistence & Startup Routing

**Input**: Design documents from `/specs/003-local-persistence-routing/`

**Prerequisites**: `plan.md` (required), `spec.md` (required), `research.md`, `data-model.md`, `contracts/`
(`database.md`, `routes.md`), `quickstart.md`

**Tests**: Included because the project constitution (§5.2.6/§5.6) requires unit tests for every
implemented task and the plan defines a Jest testing strategy. No TDD-only workflow is implied beyond
writing/updating tests alongside each story.

**Organization**: Tasks are grouped by user story (P1 → P3) so each story can be implemented and
validated independently after the shared foundation.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: `[US1]`, `[US2]`, `[US3]` for user-story phases; omitted in Setup, Foundational, and Polish
- Every task includes the exact file path(s) it touches

## Path Conventions

- Mobile app with Expo Router: `app/` (thin routes), `src/` (modules, shared, db), `drizzle/` (migrations).
- Tests: `src/modules/<module>/tests/unit/` and `src/shared/tests/unit/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Align configuration and constants with the new persistence layer. No new dependencies.

- [X] T001 [P] Update `drizzle.config.ts` so `schema` points to `./src/db/schema.ts` and keep `out: './drizzle'` with `dialect: 'sqlite'` and `driver: 'expo'`.
- [X] T002 [P] Add `DEFAULT_QUIT_GOAL` (non-empty Spanish fallback, e.g. `'Recuperar mi salud'`) to `src/shared/constants/app.ts`; keep `DEFAULT_CURRENCY = 'USD'`.
- [X] T003 [P] Verify `package.json` already contains compatible `drizzle-orm`, `expo-sqlite`, `drizzle-kit`, `expo-router`, and `zod` versions; do not install new runtime libraries.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Canonical DB layer, migration, startup hook, and shared routing helper required before any story.

**⚠ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T004 [P] Create `src/db/schema.ts` with `sqliteTable` definitions and inferred types. `user_profile` MUST define: `id` integer PK autoincrement; `daily_cigarettes` integer not null; `pack_cost` real not null; `currency` text not null; `quit_goal` text not null; `created_at` text ISO not null. `pause_events` MUST define: `id` integer PK autoincrement; `timestamp` text ISO not null; `trigger_emotion` text not null; `resisted` integer boolean 0/1 not null; `notes` text nullable. Map camelCase TS keys to the snake_case DB columns and export `UserProfile`, `NewUserProfile`, `PauseEvent`, `NewPauseEvent`, `SmokeLog`, `NewSmokeLog`, `SupplyInventoryItem`, `NewSupplyInventoryItem`.
- [X] T005 [P] Create `src/db/client.ts` exporting `DATABASE_NAME = 'pausa.db'`, `expoDatabase = openDatabaseSync(DATABASE_NAME)`, and `db = drizzle(expoDatabase, { schema })` using `drizzle-orm/expo-sqlite`.
- [X] T006 Move `src/shared/db/queries.ts` to `src/db/queries.ts` and `src/shared/db/mappers.ts` to `src/db/mappers.ts`; update their internal imports to `./client` and `./schema`. Do not leave duplicate implementations.
- [X] T007 Create `drizzle/0002_local_persistence_routing.sql`, add its entry to `drizzle/meta/_journal.json`, and import/register it in `drizzle/migrations.js`. The migration MUST preserve primary keys and row counts while rebuilding `user_profile` with only `id`, `daily_cigarettes`, `pack_cost`, `currency`, `quit_goal` (`COALESCE(quit_goal, '')`), and `created_at` converted via `strftime('%Y-%m-%dT%H:%M:%fZ', created_at / 1000.0, 'unixepoch')`; rebuild `pause_events` renaming `created_at` to `timestamp`, applying the same ISO conversion, and recreating `idx_pause_events_timestamp` on `timestamp`.
- [X] T008 Update every consumer import from `@/shared/db/*` to `@/db/*` in `src/modules/onboarding/hooks/useOnboardingProfile.ts`, `src/modules/onboarding/utils/mappers.ts`, `src/modules/pause/hooks/usePauseFlow.ts`, `src/modules/pause/utils/mappers.ts`, `src/modules/dashboard/hooks/useHomeMetrics.ts`, `src/modules/dashboard/utils/metrics.ts`, `src/modules/dashboard/tests/unit/metrics.test.ts`, and `src/shared/tests/unit/db.test.ts`; then delete `src/shared/db/` so only one Drizzle instance exists.
- [X] T009 [P] Extend `DatabaseStatus` in `src/shared/types/global.ts` with `hasProfile: boolean`; document that `ready` means schema setup finished and `hasProfile` is derived from `user_profile`.
- [X] T010 Implement `src/shared/hooks/useDatabaseInitialized.ts`: apply `useMigrations(db, migrations)`; after success execute `CREATE TABLE IF NOT EXISTS` DDL for both tables through `expoDatabase.execAsync` as a safety net; on migration failure attempt the bootstrap DDL once before setting `error`; query at least one `user_profile` row through Drizzle; return `{ ready, hasProfile, error, refresh }` where `refresh` is a stable callback that re-queries profile existence. Run all work after mount, guard state updates against unmount, and never query during render.
- [X] T011 [P] Create `src/shared/utils/routing.ts` with a pure helper `shouldRedirectToOnboarding(hasProfile: boolean, segments: readonly string[]): boolean` that returns `true` only when `hasProfile === false` and `segments[0] !== 'onboarding'`. Add it to `src/shared/utils/` (not inside a component).

**Checkpoint**: Foundation ready — schema, client, migration, startup hook, and routing helper exist; stories can now proceed.

---

## Phase 3: User Story 1 — First-Run Setup Persists the Profile (Priority: P1) 🎯 MVP

**Goal**: A person with no profile reaches onboarding, invalid numeric input is blocked, and valid input inserts exactly one profile before replacing to home.

**Independent Test**: Clear local app data, launch, confirm the loading indicator then `/onboarding`; submit empty/non-numeric/zero/negative values and confirm a toast blocks saving; submit valid values and confirm exactly one `user_profile` row with ISO `created_at`, then home; relaunch and confirm onboarding is skipped.

### Tests for User Story 1

- [X] T012 [P] [US1] Update `src/modules/onboarding/tests/unit/schema.test.ts` to cover: `daily_cigarettes` positive integer (reject empty, non-numeric, `0`, negative, decimals), `pack_cost` numeric `>= 0` (accept `0`, reject negative/NaN), non-empty `currency`, and trimmed `quit_goal` with max 280 characters.
- [X] T013 [P] [US1] Create `src/modules/onboarding/tests/unit/mappers.test.ts` asserting `buildProfileFromForm` produces `dailyCigarettes`, `packCost`, `currency`, `quitGoal` (default `DEFAULT_QUIT_GOAL` when blank), and `createdAt` as an ISO-8601 string equal to `new Date(now).toISOString()`.

### Implementation for User Story 1

- [X] T014 [P] [US1] Update `src/modules/onboarding/utils/schema.ts` to enforce the exact rules from T012 and keep `OnboardingFormValues` typed from the Zod schema with no `any`/`unknown`.
- [X] T015 [P] [US1] Update `src/modules/onboarding/utils/mappers.ts` so `buildProfileFromForm(values, now)` returns `NewUserProfile` with `createdAt: new Date(now).toISOString()` and `quitGoal` falling back to `DEFAULT_QUIT_GOAL`; keep it a pure function with no DB access.
- [X] T016 [US1] Rewrite `src/modules/onboarding/hooks/useOnboardingProfile.ts`: keep `submitting`; make `submit` return `Promise<boolean>`; validate with `onboardingSchema`; map with `buildProfileFromForm`; call `db.insert(userProfile).values(payload).returning().get()` inside a 1–3 line `try`; route validation/storage failures through `showAppToast`; reset `submitting` in all paths.
- [X] T017 [US1] Update `src/modules/onboarding/views/OnboardingScreen.tsx` so `handleSubmit` awaits `submit(formData)` and calls `router.replace('/')` only on success; keep the existing single `formData` state object and the disabled/submitting button behavior.
- [X] T018 [US1] Update `app/_layout.tsx` to consume `useDatabaseInitialized` and `shouldRedirectToOnboarding`: render an `ActivityIndicator` while `ready === false`; render a clear Spanish error message when `error !== null`; obtain segments with `useSegments()`; re-run `refresh()` when `usePathname()` changes and defer the redirect decision until that re-check settles, so onboarding → `/` does not bounce back; call `router.replace('/onboarding')` only when the helper returns `true`; otherwise render the existing `Stack`. Do not render the stack before `ready`.
- [X] T019 [US1] Run `npm run typecheck` and `npm test` (scripts in `package.json`); fix all errors before marking US1 complete. Also verify `src/modules/onboarding/tests/unit/schema.test.ts` and `mappers.test.ts` pass.

**Checkpoint**: US1 is independently functional — first-run users can complete onboarding, persist one profile, and reach home.

---

## Phase 4: User Story 2 — Returning Users Go Straight to Home (Priority: P2)

**Goal**: When a profile already exists, startup shows the loading indicator and lands on home without onboarding; direct onboarding entry cannot create a duplicate profile.

**Independent Test**: With a stored profile, launch and confirm the loading indicator appears briefly and `/` opens with no onboarding; open `/onboarding` directly and submit, confirming no second `user_profile` row is created and the app returns home.

### Tests for User Story 2

- [X] T020 [P] [US2] Create `src/shared/tests/unit/routing.test.ts` covering `shouldRedirectToOnboarding`: no profile + `['index']` → `true`; no profile + `['onboarding']` → `false`; profile exists + any segment → `false`.

### Implementation for User Story 2

- [X] T021 [US2] Add an existence guard to `submit` in `src/modules/onboarding/hooks/useOnboardingProfile.ts`: call `getProfile()` before inserting; if a profile exists, resolve `true` without writing and let the screen replace to `/`.
- [X] T022 [US2] Add an `AppState` listener in `src/shared/hooks/useDatabaseInitialized.ts` that calls `refresh()` when the app returns to the foreground, so a returning user's profile state is revalidated; ensure `app/_layout.tsx` never redirects while a re-check is in flight.
- [X] T023 [US2] Run `npm run typecheck` and `npm test` (scripts in `package.json`); fix all errors before marking US2 complete.

**Checkpoint**: US1 and US2 both work independently — first-run and returning launches route correctly, with no duplicate profile.

---

## Phase 5: User Story 3 — Pause Events Are Stored Alongside the Profile (Priority: P3)

**Goal**: Pause events persist locally with ISO timestamps, trigger, resisted outcome, and optional notes; historical reads are newest-first.

**Independent Test**: With a profile present, record a pause event, relaunch the app, and confirm the same event remains with an ISO `timestamp`, `trigger_emotion`, `resisted` 0/1, and optional `notes`; list reads are DESC by `timestamp`.

### Tests for User Story 3

- [X] T024 [P] [US3] Update `src/modules/pause/tests/unit/mappers.test.ts` to assert `buildPauseEvent` returns `timestamp` as `new Date(input.timestamp).toISOString()`, `triggerEmotion` unchanged, `resisted` 1/0, and `notes` null or the provided value.
- [X] T025 [P] [US3] Update `src/modules/dashboard/tests/unit/metrics.test.ts` fixtures to the new `PauseEvent` shape (`timestamp: string`, no `createdAt`) and `UserProfile` shape (only `id`, `dailyCigarettes`, `packCost`, `currency`, `quitGoal`, `createdAt`); keep all existing metric expectations.

### Implementation for User Story 3

- [X] T026 [US3] Update `src/modules/pause/utils/mappers.ts` to return `NewPauseEvent` with `timestamp: new Date(input.timestamp).toISOString()`, `triggerEmotion`, `resisted: input.resisted ? 1 : 0`, and `notes: input.notes ?? null`.
- [X] T027 [US3] Update `src/modules/pause/hooks/usePauseFlow.ts` to build the event with the new mapper output and keep the DB write inside a 1–3 line `try`; preserve the timer gating and no-partial-write behavior.
- [X] T028 [US3] Update `src/db/queries.ts`: `getProfile()` returns the new `UserProfile` shape; `listPauseEvents()` MUST use `orderBy(desc(pauseEvents.timestamp))`; `createPauseEvent()` and `saveProfile()` keep single-statement atomic writes.
- [X] T029 [US3] Update `src/modules/dashboard/hooks/useHomeMetrics.ts` and `src/modules/dashboard/utils/metrics.ts` for the new schema types (no `createdAt` on pause events, no dropped profile columns); keep metric formulas unchanged.
- [X] T030 [US3] Run `npm run typecheck` and `npm test` (scripts in `package.json`); fix all errors before marking US3 complete.

**Checkpoint**: All three stories are independently functional and pause events persist with the requested schema.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Remove leftovers, validate the full flow, and close governance requirements.

- [X] T031 [P] Search the repository for `shared/db`, `createdAt` on pause events, and dropped profile fields (`displayName`, `dailyTarget`, `smokeIntervalMinutes`, `packSize`, `updatedAt`); remove stale imports/types in `src/` and `app/`.
- [X] T032 [P] Review user-facing error/loading copy in `app/_layout.tsx` and `src/modules/onboarding/hooks/useOnboardingProfile.ts`; ensure all validation errors use `showAppToast` and no inline field text exists.
- [X] T033 Run the full `npm run typecheck` and `npm test` from `package.json`; confirm 0 TypeScript errors and 0 failing tests.
- [ ] T034 Execute the scenarios in `specs/003-local-persistence-routing/quickstart.md` on a simulator/device (first run, relaunch, duplicate entry, pause persistence, failure state, migration continuity); record results.
  - _Status: blocked pending a simulator/device. Automated equivalents passed: typecheck, 34 Jest tests, and a real SQLite migration test with legacy data (`node:sqlite`)._
- [X] T035 Run `git status` for the repository root (`src/`, `app/`, `drizzle/`, `specs/003-local-persistence-routing/`), summarize changed files, and present the suggested commit command for user confirmation (constitution §5.9). Do NOT commit or push automatically.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately.
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories.
- **User Story 1 (Phase 3)**: Depends on Foundational; no dependency on US2/US3.
- **User Story 2 (Phase 4)**: Depends on Foundational and US1 (uses the same onboarding hook/screen); must be validated after US1.
- **User Story 3 (Phase 5)**: Depends on Foundational; can run in parallel with US2 once US1 is complete (shares only the DB layer).
- **Polish (Phase 6)**: Depends on all desired stories being complete.

### Key Task Dependencies

- T004 → T006, T007, T010, T026, T028.
- T005 → T006, T010.
- T007 → T010 (migration runner import), T028 (query fields).
- T008 → T016, T029 (imports must resolve).
- T009 → T010 (status typing).
- T011 → T018 (layout helper).
- T014/T015 → T016 (mapping/validation available).
- T016 → T021 (duplicate guard modifies the same hook after the insert path exists).
- T010/T018 → T022 (refresh + pathname re-check).
- T026 → T027 (mapper output), T028 (query ordering).

### Within Each Story

- Update tests for the pure helpers first, then implementation.
- Update schema/mappers before hooks.
- Update hooks before screens/routes.
- Run `tsc` + `jest` before declaring the story complete.

---

## Parallel Opportunities

- **Setup**: T001, T002, T003 can run in parallel.
- **Foundational**: T004, T005, T009, T011 can run in parallel; T006/T007 depend on T004/T005; T008 waits for T006.
- **US1**: T012, T013 (tests) and T014, T015 (pure schema/mapper) can be written in parallel; T016 follows T014/T015.
- **US2**: T020 can run while T021/T022 are implemented (different files from the test).
- **US3**: T024 and T025 (test fixtures) can run in parallel with T026/T028; T027 follows T026.
- **Polish**: T031 and T032 are independent.

### Parallel Example: Foundational

```text
Task: "Create src/db/schema.ts with the requested tables and types" (T004)
Task: "Create src/db/client.ts with openDatabaseSync('pausa.db') + drizzle" (T005)
Task: "Extend DatabaseStatus in src/shared/types/global.ts" (T009)
Task: "Create src/shared/utils/routing.ts pure redirect helper" (T011)
```

### Parallel Example: User Story 1

```text
Task: "Update onboarding schema tests in src/modules/onboarding/tests/unit/schema.test.ts" (T012)
Task: "Create mapper tests in src/modules/onboarding/tests/unit/mappers.test.ts" (T013)
Task: "Update validation schema in src/modules/onboarding/utils/schema.ts" (T014)
Task: "Update profile mapper in src/modules/onboarding/utils/mappers.ts" (T015)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T003).
2. Complete Phase 2: Foundational (T004–T011) — critical; blocks all stories.
3. Complete Phase 3: User Story 1 (T012–T019).
4. **STOP and VALIDATE** using the US1 independent test: clear data → onboarding → valid save → home → relaunch skips onboarding.
5. Demo/deploy the MVP if ready.

### Incremental Delivery

1. Setup + Foundational → foundation ready.
2. US1 → first-run persistence and routing (MVP).
3. US2 → returning-user startup, duplicate protection, stale-state refresh.
4. US3 → pause-event persistence with ISO timestamps and DESC reads.
5. Polish → cleanup, full typecheck/tests, quickstart validation, commit proposal.

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together.
2. Once Foundational is done:
   - Developer A: US1 (onboarding persistence + initial routing).
   - Developer B: US3 test/mapper work can start after T004/T008; finish after US1 to avoid route conflicts.
3. Developer A or C completes US2 after US1 (same hook/screen files).
4. Polish is shared but serialized at the end.

---

## Notes

- `[P]` marks different files with no dependency on an incomplete task.
- Story labels map tasks to spec user stories for traceability.
- Tests are required by the constitution; update existing test files rather than creating versioned duplicates.
- Do not add runtime dependencies; the feature is restricted to `drizzle-orm` and `expo-sqlite`.
- Keep all DB initialization off the render path: migrations/bootstrap in effects, writes in async handlers.
- Mark each task `[x]` immediately after completion, and run `tsc` + `jest` before closing a story.
