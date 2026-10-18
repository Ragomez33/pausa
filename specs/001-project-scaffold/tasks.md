---

description: "Task list for Initial Project Scaffold"

---

# Tasks: Initial Project Scaffold

**Input**: Design documents from `/specs/001-project-scaffold/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Included selectively — the project constitution (§5.6, §5.7) mandates unit tests for
utility/DB logic, so a minimal test set is included for the shared utilities and data layer.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Thin router: `app/`
- Application logic: `src/modules/<module>/`, `src/shared/`

> **Constitution §5.3 reminder**: Before running any dependency install command, notify the user of
> the technical need and benefit. `@types/*` dev installs are pre-authorized.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize the Expo project and lay down configuration + directory structure.

- [x] T001 Initialize Expo SDK 54 + Expo Router + TypeScript project at the repository root using the official default template (`npx create-expo-app@latest . --template default`), then reconcile generated files with the constitution structure
- [x] T002 [P] Install navigation/core dependencies (`expo-router`, `react-native-safe-area-context`, `react-native-screens`, `expo-constants`, `expo-status-bar`, `expo-linking`) via `npx expo install`
- [x] T003 [P] Install UI dependencies (`@gluestack-ui/themed`, `@gluestack-style/react`, `react-native-svg`, `lucide-react-native`, `react-native-reanimated`) via `npx expo install`
- [x] T004 [P] Install local-first DB dependencies (`drizzle-orm`, `expo-sqlite`) and dev dependencies (`drizzle-kit`, `babel-plugin-inline-import`)
- [x] T005 [P] Install notification/background dependencies (`expo-notifications`, `expo-task-manager`) via `npx expo install`
- [x] T006 [P] Install validation dependency (`zod`)
- [x] T007 Create the directory hierarchy under `app/` and `src/` per plan.md, adding `.gitkeep` files to empty directories
- [x] T008 Configure `tsconfig.json` with `"strict": true` and path alias `"@/*" -> "./src/*"`
- [x] T009 [P] Create `eas.json` with `development`, `preview`, and `production` build profiles per spec
- [x] T010 [P] Configure `app.json` with the `pausa` URL scheme, app identity fields, and `expo-sqlite` + `expo-notifications` plugins
- [x] T011 [P] Create `drizzle.config.ts` targeting `dialect: 'sqlite'`, `driver: 'expo'`, schema `./src/shared/db/schema.ts`, out `./drizzle`
- [x] T012 [P] Configure `babel.config.js` with `babel-preset-expo`, `inline-import` (`.sql`) plugin, and `react-native-reanimated/plugin` last
- [x] T013 Configure Gluestack UI provider config (`gluestack-ui.config.ts` + `components/` setup) so themed primitives resolve

**Checkpoint**: Project initializes, dependencies present, config files valid.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure required before ANY user story can be implemented.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T014 [P] Create shared global types in `src/shared/types/global.ts` (no `any`/`unknown` per code-rules §1)
- [x] T015 Create Drizzle schema in `src/shared/db/schema.ts` defining `user_profile`, `smoke_logs`, and `supply_inventory` per data-model.md, with `smoke_logs.createdAt` and `supply_inventory.purchasedAt` indexes
- [x] T016 Create the typed SQLite client in `src/shared/db/client.ts` (open DB once, export typed Drizzle instance) per contracts/database.md
- [x] T017 Generate initial migrations with `npx drizzle-kit generate` into `./drizzle`
- [x] T018 Create the startup DB initialization hook `src/shared/hooks/useDatabaseInitialized.ts` applying migrations idempotently and returning `{ ready, error }`
- [x] T019 [P] Create `src/shared/utils/utils.ts` with global pure helpers (e.g. `formatTimeRemaining`, `formatDate`)
- [x] T020 [P] Create `src/shared/utils/toast.ts` exporting `showAppToast` as the only sanctioned toast entry point (code-rules §7)
- [x] T021 [P] Create `src/shared/utils/notifications.ts` as the centralized local-notification manager stub (code-rules §7)
- [x] T022 Configure `jest-expo` preset + `jest` block in `package.json`; install `@types/jest` as a dev dependency
- [x] T023 Create a reusable placeholder screen component in `src/shared/components/PlaceholderScreen.tsx` using Gluestack UI primitives

**Checkpoint**: Foundation ready — app can initialize its database and routes can be built.

---

## Phase 3: User Story 1 - Developer Boots a Working Skeleton (Priority: P1) 🎯 MVP

**Goal**: A bootable app with a global layout, home route, and reachable placeholder routes.

**Independent Test**: Fresh install → `npx tsc --noEmit` returns 0 errors; app boots to `/`; `/pause`, `/onboarding`, `/team` render without errors.

- [x] T024 [US1] Implement root layout `app/_layout.tsx` wrapping routes in `GluestackUIProvider`, running DB initialization, and rendering a safe loading/error state
- [x] T025 [P] [US1] Create `DashboardScreen` in `src/modules/dashboard/views/DashboardScreen.tsx` and route `app/index.tsx` that imports and renders it
- [x] T026 [P] [US1] Create `PauseScreen` in `src/modules/pause/views/PauseScreen.tsx` and route `app/pause/index.tsx` that imports and renders it
- [x] T027 [P] [US1] Create `OnboardingScreen` in `src/modules/onboarding/views/OnboardingScreen.tsx` and route `app/onboarding/index.tsx` that imports and renders it
- [x] T028 [P] [US1] Create nested team layout `app/team/_layout.tsx`, plus `TeamScreen` (`src/modules/team/views/TeamScreen.tsx` + `app/team/index.tsx`) and `TeamDetailScreen` (`src/modules/team/views/TeamDetailScreen.tsx` + `app/team/[id].tsx`)
- [x] T029 [US1] Run `npx tsc --noEmit` and resolve all type errors to reach 0 errors (FR-003)

**Checkpoint**: App is bootable and navigable; US1 independently testable.

---

## Phase 4: User Story 2 - Local-First Data Foundation Is Ready (Priority: P2)

**Goal**: Typed local persistence for the three initial domain entities, with DESC-ordered log reads.

**Independent Test**: On first launch the 3 tables exist; a second launch is idempotent with no data loss; importing schema types type-checks without `any`/`unknown`.

- [x] T030 [US2] Implement historical log getters (e.g. `listSmokeLogs`) returning records DESC by timestamp in `src/shared/db/queries.ts` (code-rules §11)
- [x] T031 [P] [US2] Add unit tests for shared utilities in `src/shared/tests/unit/utils.test.ts`
- [x] T032 [P] [US2] Add unit tests for the schema/mappers in `src/shared/tests/unit/db.test.ts`
- [x] T033 [US2] Verify migration idempotency by initializing the DB twice and confirming no data loss (update startup hook if needed)
- [x] T034 [US2] Run `npm test` and `npx tsc --noEmit`, resolving all failures before completion (constitution §5.6)

**Checkpoint**: Local-first data foundation verified; US2 independently testable.

---

## Phase 5: User Story 3 - Consistent Configuration and Conventions (Priority: P3)

**Goal**: Root config files and directory hierarchy match the constitution so new modules can be added predictably.

**Independent Test**: Required config files exist and are valid; the tree matches plan.md; `pausa://team` resolves.

- [x] T035 [US3] Verify `eas.json`, `app.json` (scheme + plugins), `drizzle.config.ts`, `babel.config.js`, and `tsconfig.json` (strict + alias) are present and valid (FR-009, FR-010, FR-011, FR-007)
- [x] T036 [US3] Verify the `app/` + `src/` hierarchy matches plan.md and constitution §1.1 (FR-012)
- [x] T037 [US3] Validate the `pausa://` deep-linking scheme resolves to `/team` using `npx uri-scheme open pausa://team`
- [x] T038 [US3] Create module `views/`, `hooks/`, `utils/`, `modals/` (or `dialogs/`), and `tests/` subfolders with `.gitkeep` for all 7 modules (`dashboard`, `pause`, `onboarding`, `supply`, `team`, `analytics`, `settings`)

**Checkpoint**: Configuration and structure consistent; US3 independently testable.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and repository hygiene.

- [x] T039 [P] Add root `.gitignore` entries for `node_modules/`, `.expo/`, `drizzle/` build output as appropriate, and local DB artifacts
- [x] T040 [P] Update `README.md` with setup, run, and type-check commands
- [x] T041 Run the full `quickstart.md` validation checklist end-to-end and confirm all items pass
- [x] T042 Final gate: run `npx tsc --noEmit` (0 errors) and `npm test` (0 failures) (constitution §5.6)
- [x] T043 Git checkpoint: run `git status` and present the suggested commit message for user confirmation — do NOT commit or push automatically (constitution §5.9)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately.
- **Foundational (Phase 2)**: Depends on Setup (T015–T018 depend on T004).
- **User Stories (Phase 3–5)**: All depend on Foundational completion.
- **Polish (Phase 6)**: Depends on all user stories.

### Story Completion Order

- **US1 (P1)** depends on Foundational (needs DB init hook T018 and placeholder component T023).
- **US2 (P2)** depends on Foundational (schema T015, client T016); independent of US1.
- **US3 (P3)** depends on Setup config tasks; largely independent of US1/US2.

### Parallel Opportunities

- Setup: T002–T006 (dependency installs) can run in parallel; T009–T012 (config files) in parallel.
- Foundational: T014, T019, T020, T021 in parallel.
- US1: T025, T026, T027, T028 (screens/routes) in parallel after T024.
- US2: T031, T032 in parallel.

---

## Parallel Example: User Story 1

```bash
# After T024 (root layout) completes, launch screens in parallel:
Task: "Create DashboardScreen in src/modules/dashboard/views/DashboardScreen.tsx + app/index.tsx"
Task: "Create PauseScreen in src/modules/pause/views/PauseScreen.tsx + app/pause/index.tsx"
Task: "Create OnboardingScreen in src/modules/onboarding/views/OnboardingScreen.tsx + app/onboarding/index.tsx"
Task: "Create Team layout/screens in app/team/* + src/modules/team/views/*"
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Complete Phase 1 (Setup) → Phase 2 (Foundational).
2. Complete Phase 3 (US1).
3. **STOP and VALIDATE**: `npx tsc --noEmit` = 0 errors; app boots; routes reachable.
4. This is the minimal viable architecture.

### Incremental Delivery

1. Foundation → US1 (bootable skeleton, MVP).
2. Add US2 (typed local data layer + tests).
3. Add US3 (config/structure consistency).
4. Polish and final gates.

---

## Notes

- All tasks follow the strict checklist format: `- [ ] T### [P?] [US?] description + file path`.
- Install tasks must respect constitution §5.3 (notify before installing).
- No file may use `any`/`unknown` without narrowing (code-rules §1).
- Never commit/push without explicit user confirmation (constitution §5.9).
- **T033 caveat**: migration idempotency is guaranteed by Drizzle's `useMigrations` (applied
  migrations are tracked in `__drizzle_migrations`). Device-level runtime verification was not
  possible in this environment; the app must be launched on a simulator/device to confirm SC-004.
- **Not runtime-verified here**: app boot, route navigation, and deep-link resolution (SC-002,
  FR-001/002/010) require a simulator/device. `tsc` (0 errors) and `jest` (8/8) were verified.
