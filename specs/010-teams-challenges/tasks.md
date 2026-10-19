# Tasks: Teams & Level Challenges

**Input**: Design documents from `/specs/010-teams-challenges/`

**Prerequisites**: `plan.md` (required), `spec.md` (required), `research.md`, `data-model.md`,
`contracts/` (`database.md`, `routes.md`), `quickstart.md`

**Tests**: Included because the project constitution (§5.2.6/§5.6) requires unit tests and the plan defines
a Jest strategy. Pure formulas/codes/rankings are tested first; native screens are validated through
`quickstart.md`.

**Organization**: Tasks are grouped by user story (P1 → P4). Schema, IDs/codes, formulas, validation,
queries, summary, and leaderboard helpers are foundational because every story depends on them.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: `[US1]`–`[US4]` for user-story phases; omitted in Setup, Foundational, and Polish
- Every task includes the exact file path(s) it touches

## Path Conventions

- Mobile app with Expo Router: `app/`, `src/modules/team/`, `src/db/`, `drizzle/`.
- Tests: `src/modules/team/tests/unit/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the existing stub and required dependencies.

- [X] T001 [P] Verify `package.json` already lists `drizzle-orm`, `expo-sqlite`, `expo-router`, `zod`, and `nativewind`; do not install new runtime libraries.
- [X] T002 [P] Inspect `src/db/schema.ts`, `src/db/queries.ts`, `src/modules/team/views/TeamScreen.tsx`, and `app/team/*` to confirm the stub tables/UI and that no user-created team data exists.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schema/migration, pure formulas/codes/rankings, validation, and transactional queries.

**⚠ CRITICAL**: Complete before user stories.

- [X] T003 Rebuild `teams` and `teamMembers` in `src/db/schema.ts`: `teams` (`id` text PK, `name` text not null, `inviteCode` text not null unique, `difficultyLevel` text not null, `durationDays` integer not null, `createdAt` text ISO not null); `teamMembers` (`id` text PK, `teamId` text not null → teams.id cascade, `userName` text not null, `dailyLimit` integer not null, `role` text not null (`leader|member`), `joinedAt` text ISO not null, `postponedCount` integer not null default 0, `smokedToday` integer not null default 0, `streakDays` integer not null default 0, `hadStumble` integer 0/1 not null default 0). Add unique invite index and team-id index; export all types.
- [X] T004 Create `drizzle/0006_teams_challenges.sql`: drop `team_members` then `teams`, recreate both with the T003 columns and indexes, update `drizzle/meta/_journal.json`, register in `drizzle/migrations.js`, and update the bootstrap SQL in `src/shared/hooks/useDatabaseInitialized.ts`. Validate 0000–0006 with `node:sqlite` (columns, unique invite index, FK, defaults).
- [X] T005 [P] Create `src/modules/team/utils/ids.ts` (local text-id generator) and `src/modules/team/utils/inviteCodes.ts` (`generateInviteCode`, `normalizeInviteCode`, `isValidInviteCode`): 6 uppercase alphanumeric characters; trim/uppercase on normalize; 4–12 alphanumeric validation.
- [X] T006 [P] Create `src/modules/team/utils/difficulty.ts`: `DifficultyLevel` union, level labels, and `calculateDailyLimit(dailyCigarettes, level)` = `max(0, floor(daily × multiplier))` with multipliers Fácil 1, Medio 0.75, Difícil 0.5, Modo Dios 0.25.
- [X] T007 [P] Create `src/modules/team/utils/schema.ts` with Zod schemas: create (name trimmed 2–40, duration positive integer, difficulty enum) and join (normalized code 4–12 alphanumeric). Export inferred types.
- [X] T008 [P] Create `src/modules/team/tests/unit/{difficulty,inviteCodes,schema}.test.ts`: all four limit multipliers, zero profile, code generation/normalization/validation, name/duration/difficulty/code validation failures.
- [X] T009 Update `src/db/queries.ts`: `getTeamByInviteCode`, `createTeamWithLeader`, `joinTeamByInviteCode` (transactions, duplicate membership guard), `getActiveTeam` (most recent `joinedAt`), `listTeamMembers(teamId)`, and `updateTeamMemberProgress`. Export result types; errors are returned/thrown only to the service boundary, never silently ignored.
- [X] T010 [P] Create `src/modules/team/utils/summary.ts`: collective postponed sum, avoided cigarettes = collective postponed, money saved = `(avoided / 20) × profile.pack_cost`, remaining days from `createdAt + durationDays`, expired flag, and `buildTeamSummary(team, members, packCost, nowMs)`.
- [X] T011 [P] Create `src/modules/team/utils/leaderboard.ts`: `buildLeaderboard(members)` for Guardián (max postponed), Inquebrantable (max streak), Resiliente (max streak among `had_stumble = 1 && smoked_today <= daily_limit`); ties by `user_name` locale compare then member id; null when no eligible member.
- [X] T012 [P] Create `src/modules/team/tests/unit/{summary,leaderboard}.test.ts`: collective totals, remaining/expired days, each distinction, Resiliente eligibility, tie-breaks, and empty states.

**Checkpoint**: Schema, migration, formulas, validation, queries, summary, and leaderboard ready.

---

## Phase 3: User Story 1 — Create a Team Challenge (Priority: P1) 🎯 MVP

**Goal**: A create form stores a team + leader atomically with a unique code and calculated daily limit.

**Independent Test**: Create a team with a known profile and level; verify stored fields, unique code, leader role, and calculated limit. Invalid forms write nothing.

### Implementation for User Story 1

- [X] T013 [P] [US1] Update `src/modules/team/utils/constants.ts`: level labels/options, duration presets (7/14/30/60), default user name "Tú", and UI copy. Keep existing rank labels.
- [X] T014 [US1] Create `src/modules/team/hooks/useCreateTeam.ts`: load the profile, expose form state (name, duration, level), computed daily-limit preview, validation via the create schema, a synchronous submit guard, and `submit()` calling `createTeamWithLeader`; toast errors; return success for navigation.
- [X] T015 [US1] Create `src/modules/team/views/CreateTeamScreen.tsx`: name input, duration chips, level chips with labels, live limit preview, submit/cancel actions, loading/submitting state. NativeWind/native primitives only; no inline validation text.
- [X] T016 [US1] Create `app/team/create.tsx` rendering `CreateTeamScreen`.
- [X] T017 [US1] Run `npm run typecheck` and `npm test` (scripts in `package.json`); fix all errors before marking US1 complete.

**Checkpoint**: US1 works — teams can be created with leader membership.

---

## Phase 4: User Story 2 — Join a Team by Invite Code (Priority: P2)

**Goal**: A join form resolves a normalized local invite code and adds one member with the calculated limit.

**Independent Test**: Join a locally created team with a lowercase/space-padded code; verify one member row and limit. Unknown codes and duplicate joins write nothing.

### Implementation for User Story 2

- [X] T018 [US2] Create `src/modules/team/hooks/useJoinTeam.ts`: profile load, code form state, normalization, join-schema validation, duplicate/unknown errors, submit guard, and `submit()` calling `joinTeamByInviteCode`; toast errors and return success.
- [X] T019 [US2] Create `src/modules/team/views/JoinTeamScreen.tsx`: invite-code input, local-only explanation, submit/cancel actions, submitting state. NativeWind/native primitives only.
- [X] T020 [US2] Create `app/team/join.tsx` rendering `JoinTeamScreen`.
- [X] T021 [US2] Run `npm run typecheck` and `npm test` (scripts in `package.json`); fix all errors before marking US2 complete.

**Checkpoint**: US1 and US2 work — create/join flows are complete.

---

## Phase 5: User Story 3 — See the Squad Dashboard (Priority: P3)

**Goal**: The active team dashboard shows metadata, collective metrics, and each member's today/limit.

**Independent Test**: Seed an active team with members/snapshots, open `/team`, and verify metadata, collective metrics, and member today/limit values; empty data shows the create/join empty state.

### Implementation for User Story 3

- [X] T022 [US3] Create `src/modules/team/hooks/useTeamDashboard.ts`: load the active team, members, and profile on focus; refresh the local member ("Tú") snapshot from `postponed_count`, today's smoking count, shared streak helpers, and stumble approximation; build the team summary; expose `{ loading, hasProfile, team, members, summary, leaderboard, error, refresh }`.
- [X] T023 [US3] Replace `src/modules/team/views/TeamScreen.tsx` with the squad dashboard: empty state with create/join actions; team header (name, level, duration/remaining, code, member count); three collective cards; member rows with today/limit and empty progress states. Keep NativeWind/native primitives.
- [X] T024 [US3] Run `npm run typecheck` and `npm test` (scripts in `package.json`); fix all errors before marking US3 complete.

**Checkpoint**: US1–US3 work — teams are visible with collective and member metrics.

---

## Phase 6: User Story 4 — Recognize Team Distinctions (Priority: P4)

**Goal**: The dashboard shows Guardián, Inquebrantable, and Resiliente with deterministic winners or empty states.

**Independent Test**: Seed members with known postponed counts, streaks, and stumble flags; verify each distinction and tie behavior; remove eligibility and verify empty cards.

### Implementation for User Story 4

- [X] T025 [US4] Create/extend `src/modules/team/views/Leaderboard.tsx` using `buildLeaderboard`, with three rank cards, winner names, descriptions, and empty states. Integrate it into `src/modules/team/views/TeamScreen.tsx` below the member list.
- [X] T026 [US4] Run `npm run typecheck` and `npm test` (scripts in `package.json`); fix all errors before marking US4 complete.

**Checkpoint**: All stories work — create, join, dashboard, and distinctions.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Cleanup, accessibility, full validation, and governance.

- [X] T027 [P] Search `src/` and `app/` for stale `goal_level`, `local_name`, `status`, integer team-id assumptions, old `GOAL_LEVEL_LABELS`, and unused `[id].tsx` references; clean up.
- [X] T028 [P] Review `CreateTeamScreen`, `JoinTeamScreen`, `TeamScreen`, and `Leaderboard` for touch targets, contrast, long-name/code wrapping, and clear empty/submitting states.
- [X] T029 Run `npm run lint`, `npm run typecheck`, and `npm test` from `package.json`; confirm 0 errors and 0 failing tests.
- [ ] T030 Execute the scenarios in `specs/010-teams-challenges/quickstart.md` on a simulator/device (create, invalid form, join/normalize/duplicate/unknown code, dashboard totals, leaderboard ties, profile/zero/storage edge cases); record results.
  - _Status: blocked pending a simulator/device. Automated equivalents passed: lint, typecheck, 151 Jest tests, and a real SQLite migration test for 0000–0006._
- [X] T031 Run `git status` for the repository root (`src/`, `app/`, `drizzle/`, `specs/010-teams-challenges/`), summarize changed files, and present the suggested commit command for user confirmation (constitution §5.9). Do NOT commit or push automatically.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup — blocks all stories.
- **US1 (Phase 3)**: Depends on Foundational.
- **US2 (Phase 4)**: Depends on Foundational; can run after US1 for shared constants/UI.
- **US3 (Phase 5)**: Depends on Foundational and at least one team (US1/US2).
- **US4 (Phase 6)**: Depends on US3 (dashboard integration).
- **Polish (Phase 7)**: Depends on all stories.

### Key Task Dependencies

- T003 → T004/T009; T005–T007 → T008/T009.
- T009/T010/T011 → T012 → T014/T018/T022.
- T013/T014 → T015/T016 → T017.
- T018/T019 → T020 → T021.
- T022/T023 → T024 → T025 → T026.
- T029 → T030 → T031.

### Within Each Story

- Pure helpers/tests before hooks.
- Hooks before screens.
- Screens before route files.
- Run `tsc` + `jest` before closing a story.

---

## Parallel Opportunities

- **Setup**: T001, T002.
- **Foundational**: T005, T006, T007, T010, T011 (different files), with T008/T012 test work.
- **US3/US4**: summary/leaderboard pure work is already foundational; dashboard and leaderboard components can be developed in parallel once the hook exists.
- **Polish**: T027, T028.

### Parallel Example: Foundational

```text
Task: "Create IDs and invite-code helpers" (T005)
Task: "Create difficulty limit formula" (T006)
Task: "Create team validation schemas" (T007)
Task: "Create summary math" (T010)
Task: "Create leaderboard logic" (T011)
```

### Parallel Example: User Story 3 / 4

```text
Task: "Create useTeamDashboard hook" (T022)
Task: "Create Leaderboard component" (T025)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Setup (T001–T002).
2. Complete Foundational (T003–T012).
3. Complete US1 (T013–T017).
4. **STOP and VALIDATE** with the US1 independent test.
5. Demo team creation with leader + limit.

### Incremental Delivery

1. Setup + Foundational → schema, formulas, queries.
2. US1 → create team (MVP).
3. US2 → join by code.
4. US3 → squad dashboard.
5. US4 → distinctions.
6. Polish → cleanup, full checks, device validation, commit proposal.

### Parallel Team Strategy

1. Team completes Setup + Foundational together.
2. US1 and US2 can be split after the shared constants/hooks contract is agreed.
3. US3 depends on a persisted team; US4 follows the dashboard.

---

## Notes

- `[P]` marks different files with no dependency on an incomplete task.
- Story labels map to spec user stories.
- Tests are required by the constitution; update existing test files rather than creating versioned duplicates.
- No new runtime dependencies, no network calls, no cross-device sync.
- The stub team tables are rebuilt; no user-created team data exists.
- Mark each task `[X]` immediately after completion, and run `tsc` + `jest` before closing a story.
