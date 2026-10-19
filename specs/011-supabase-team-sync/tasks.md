# Tasks: Supabase Team Sync

**Input**: Design documents from `/specs/011-supabase-team-sync/`

**Prerequisites**: `plan.md` (required), `spec.md` (required), `research.md`, `data-model.md`,
`contracts/` (`supabase.md`, `sync.md`), `quickstart.md`

**Tests**: Included because the project constitution (§5.2.6/§5.6) requires unit tests and the plan defines
a Jest strategy. Pure queue/merge/status logic and migration are tested automatically; Supabase schema,
RLS, and realtime are validated through `quickstart.md`.

**Organization**: Tasks are grouped by user story (P1 → P4). Client config, remote SQL, local outbox,
queries, merge/status helpers, and the sync engine are foundational because all stories depend on them.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: `[US1]`–`[US4]` for user-story phases; omitted in Setup, Foundational, and Polish
- Every task includes the exact file path(s) it touches

## Path Conventions

- Mobile app with Expo Router: `app/`, `src/services/`, `src/modules/team/`, `src/db/`, `drizzle/`, `supabase/`.
- Tests: `src/modules/team/tests/unit/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add the only new dependency and public configuration scaffolding.

- [X] T001 Install `@supabase/supabase-js` using `npm install @supabase/supabase-js` after notifying the user (constitution §5.3); update `package.json` and `package-lock.json`. Do not install any other runtime package.
- [X] T002 [P] Create `.env.example` with `EXPO_PUBLIC_SUPABASE_URL=` and `EXPO_PUBLIC_SUPABASE_ANON_KEY=` placeholders; add `.env` to `.gitignore` while keeping existing patterns.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Supabase client, remote schema, local outbox, pure merge/status helpers, and sync engine.

**⚠ CRITICAL**: Complete before user stories.

- [X] T003 [P] Create `src/services/supabase.ts`: lazy singleton client from `EXPO_PUBLIC_SUPABASE_URL`/`EXPO_PUBLIC_SUPABASE_ANON_KEY`; export `isSupabaseConfigured()` and `getSupabaseClient(): SupabaseClient | null`; return `null` for missing/invalid values and never throw at module load.
- [X] T004 [P] Create `supabase/migrations/0001_team_sync.sql`: `teams`, `team_members`, `shared_events` tables per `data-model.md`, indexes (`teams.invite_code` unique, `shared_events.team_id`), RLS policies for anon read/insert without destructive updates, and add `shared_events` to the realtime publication.
- [X] T005 Add `teamEventOutbox` to `src/db/schema.ts` (`id` text PK, `teamId`, `userName`, `eventType` posponed/smoked, `timestamp` ISO, `status` pending/sent/failed, `attempts` default 0, `lastError` nullable, `createdAt` ISO) with index `idx_team_event_outbox_status` on `(status, created_at)`; create `drizzle/0007_team_sync_outbox.sql`, update journal/`migrations.js`/bootstrap SQL, and validate 0000–0007 with `node:sqlite` (no `trigger_emotion` column).
- [X] T006 [P] Update `src/db/queries.ts`: `enqueueTeamEvent`, `listPendingTeamEvents(limit?)` (oldest first), `markTeamEventSent`, `markTeamEventFailed`, and `countPendingTeamEvents`. Export the outbox type.
- [X] T007 [P] Create `src/modules/team/sync/teamEvents.ts` with `buildTeamSharedEvent(eventType, team, userName, nowMs)` returning an outbox payload containing only id, team_id, user_name, event_type, timestamp, status, attempts, created_at. Add `src/modules/team/tests/unit/teamEvents.test.ts` proving no trigger emotion/notes are present and ids are unique.
- [X] T008 [P] Create `src/modules/team/sync/mergeRemoteEvents.ts` with `SharedEvent` type and `mergeRemoteMembers(members, remoteEvents, localUserName, nowMs)`: dedupe by id, keep local snapshot for the local user, derive postponed/smoked-today/streak/stumble for others, ignore unknown users. Add `src/modules/team/tests/unit/mergeRemoteEvents.test.ts`.
- [X] T009 [P] Create `src/modules/team/sync/syncStatus.ts` with `deriveTeamSyncStatus({ configured, pendingCount, syncing, lastError })` returning `disabled|pending|offline|syncing|synced|error`. Add `src/modules/team/tests/unit/syncStatus.test.ts`.
- [X] T010 Create `src/modules/team/sync/teamSync.ts`: `enqueueTeamSharedEvent(type)` (active team + config guard, no throw, privacy-safe payload), serialized FIFO `flushTeamOutbox()` (upsert remote by event id, mark sent/failed, stop on fatal config/auth errors), `getTeamSyncStatusSnapshot()`, and a listener bus for status changes. Use `getActiveTeam`, outbox queries, `DEFAULT_TEAM_USER_NAME`, and `getSupabaseClient`.
- [X] T011 [P] Create `src/modules/team/sync/useTeamRealtime.ts`: subscribe to `shared_events` INSERTs filtered by `team_id=eq.<teamId>` via `supabase.channel('team:<id>')`, dedupe events by id, expose `{ events, status }`, and remove the channel on team change/unmount. Return disabled/no channel when config is missing.
- [X] T012 [P] Create `src/modules/team/sync/useTeamSync.ts`: flush on app foreground and while pending items exist (60-second timer), subscribe to the sync status bus, and clean up timers/listeners. No-op when unconfigured or no active team.

**Checkpoint**: Client, remote SQL, outbox, merge/status helpers, sync engine, and lifecycle hooks ready.

---

## Phase 3: User Story 1 — Keep Team Activity Safe Offline (Priority: P1) 🎯 MVP

**Goal**: Successful local postpone/session actions enqueue exactly one privacy-safe team event; no active team means no event.

**Independent Test**: Offline with an active team, postpone and complete a session; both local actions succeed and two outbox rows exist with correct team/type/timestamp and no trigger emotion. Without a team, no rows appear.

### Implementation for User Story 1

- [X] T013 [US1] In `src/modules/awareness/hooks/useAwarenessLoop.ts`, call `enqueueTeamSharedEvent('posponed')` fire-and-forget after a successful local postponement only; do not enqueue on failure.
- [X] T014 [US1] In `src/modules/smoking/hooks/useSmokingSession.ts`, call `enqueueTeamSharedEvent('smoked')` fire-and-forget after a successful session record (including empty-inventory sessions); do not enqueue on failure.
- [X] T015 [US1] Run `npm run typecheck` and `npm test` (scripts in `package.json`); fix all errors before marking US1 complete.

**Checkpoint**: US1 works — offline actions are durably queued and private.

---

## Phase 4: User Story 2 — Synchronize Shared Events in the Background (Priority: P2)

**Goal**: Pending events flush asynchronously, retry after failures, survive restarts, and never block local flows.

**Independent Test**: Queue events, flush with connectivity, verify exactly one remote row per event id and sent status; simulate failure and confirm the event remains pending. Restart the app and confirm persistence.

### Implementation for User Story 2

- [X] T016 [US2] Integrate `useTeamSync()` into `app/_layout.tsx` after DB readiness so foreground flush/timer behavior starts globally without blocking render.
- [X] T017 [US2] In `src/modules/team/hooks/useTeamDashboard.ts`, trigger `flushTeamOutbox()` on focus (fire-and-forget) and include the current sync status in the returned state; never await it in the render path.
- [X] T018 [US2] Run `npm run typecheck` and `npm test` (scripts in `package.json`); fix all errors before marking US2 complete.

**Checkpoint**: US1 and US2 work — queue + background sync are functional and resilient.

---

## Phase 5: User Story 3 — See Team Activity Update in Real Time (Priority: P3)

**Goal**: The open dashboard subscribes to active-team events and updates counters, member metrics, leaderboard, and distinctions without manual refresh.

**Independent Test**: Insert a remote event for the active team; verify the dashboard updates within a few seconds, local echoes are counted once, and leaving/switching teams removes the channel.

### Implementation for User Story 3

- [X] T019 [US3] Integrate `useTeamRealtime(team?.id ?? null)` into `src/modules/team/hooks/useTeamDashboard.ts`; merge remote events via `mergeRemoteMembers`, recompute summary/leaderboard, expose realtime status, and keep local data authoritative.
- [X] T020 [US3] Update `src/modules/team/views/TeamScreen.tsx` to reflect realtime connection state and automatic updates without adding manual refresh; keep the existing summary, members, and leaderboard components.
- [X] T021 [US3] Run `npm run typecheck` and `npm test` (scripts in `package.json`); fix all errors before marking US3 complete.

**Checkpoint**: US1–US3 work — realtime team activity updates the dashboard.

---

## Phase 6: User Story 4 — Understand Sync Status and Privacy (Priority: P4)

**Goal**: Sharing state is clear, team/member rows are mirrored best-effort, and no emotional data is transmitted.

**Independent Test**: Create/join with config present and verify team/member mirror rows; inspect outbox/remote payloads for absent trigger emotions; verify disabled/offline/pending/synced/error banners.

### Implementation for User Story 4

- [X] T022 [US4] In `src/modules/team/utils/service.ts`, add best-effort async mirroring of team and member rows to Supabase after successful local create/join when configured; capture failures without affecting local success or navigation.
- [X] T023 [US4] Update `src/modules/team/views/TeamScreen.tsx` and `src/modules/team/hooks/useTeamDashboard.ts` with a non-blocking sync status banner (disabled/pending/offline/syncing/synced/error) and pending count; surface fatal remote errors clearly without hiding local data.
- [X] T024 [US4] Run `npm run typecheck` and `npm test` (scripts in `package.json`); fix all errors before marking US4 complete.

**Checkpoint**: All stories work — local queue, background sync, realtime, status, privacy, and mirroring.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Privacy audit, full validation, and governance.

- [X] T025 [P] Search `src/`, `app/`, and `supabase/` for `trigger_emotion`/notes in outbox or remote payloads, unguarded Supabase imports, blocking awaits in render paths, and stale batch/reminder code; fix leaks and remove dead code.
- [X] T026 Run `npm run lint`, `npm run typecheck`, and `npm test` from `package.json`; confirm 0 errors and 0 failing tests.
- [ ] T027 Execute the scenarios in `specs/011-supabase-team-sync/quickstart.md` against a configured Supabase project (disabled config, offline queue/restart, flush/retry/idempotency, realtime updates/dedupe/cleanup, status states, privacy payloads, individual offline features); record results.
  - _Status: blocked pending a configured Supabase project and device/emulator. Automated equivalents passed: lint, typecheck, 163 Jest tests, and local outbox migration validation._
- [X] T028 Run `git status` for the repository root (`src/`, `app/`, `drizzle/`, `supabase/`, `specs/011-supabase-team-sync/`), summarize changed files, and present the suggested commit command for user confirmation (constitution §5.9). Do NOT commit or push automatically.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup — blocks all stories.
- **US1 (Phase 3)**: Depends on Foundational.
- **US2 (Phase 4)**: Depends on Foundational and US1 (queue items).
- **US3 (Phase 5)**: Depends on Foundational and US2 (dashboard integration).
- **US4 (Phase 6)**: Depends on US2/US3 (status and mirroring).
- **Polish (Phase 7)**: Depends on all stories.

### Key Task Dependencies

- T001 → T003–T027.
- T003 → T010/T011/T022.
- T004 → remote validation in T022/T027.
- T005/T006 → T007/T010.
- T008/T009 → T010 → T012/T013/T014.
- T010 → T016/T017.
- T011 → T019 → T020.
- T022/T023 → T024.
- T026 → T027 → T028.

### Within Each Story

- Pure helpers/tests before engine integration.
- Engine before enqueue integrations.
- Hooks before screen changes.
- Run `tsc` + `jest` before closing a story.

---

## Parallel Opportunities

- **Setup**: T002 after/alongside T001.
- **Foundational**: T003, T004, T006, T007, T008, T009, T011, T012 (different files) once their prerequisites exist.
- **US1**: T013 and T014 are different modules and can run in parallel.
- **Polish**: T025 is independent of final checks.

### Parallel Example: Foundational

```text
Task: "Create Supabase client service" (T003)
Task: "Create remote SQL schema/RLS" (T004)
Task: "Create outbox queries" (T006)
Task: "Create privacy-safe event payload tests" (T007)
Task: "Create mergeRemoteMembers + tests" (T008)
Task: "Create sync status helper + tests" (T009)
```

### Parallel Example: User Story 1

```text
Task: "Enqueue posponed after postponement" (T013)
Task: "Enqueue smoked after session completion" (T014)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Setup (T001–T002) — install Supabase client, env scaffolding.
2. Complete Foundational (T003–T012).
3. Complete US1 (T013–T015).
4. **STOP and VALIDATE** with the US1 independent test.
5. Demo durable offline queueing.

### Incremental Delivery

1. Setup + Foundational → client, remote SQL, outbox, merge/status, engine.
2. US1 → offline-private queueing (MVP).
3. US2 → background flush/retry.
4. US3 → realtime dashboard.
5. US4 → mirroring, status visibility, privacy.
6. Polish → audit, full checks, Supabase validation, commit proposal.

### Parallel Team Strategy

1. Team completes Setup + Foundational together.
2. US1 and US4 mirroring can split after the engine/remote SQL exist.
3. US2 and US3 are sequential because both touch the dashboard hook.

---

## Notes

- `[P]` marks different files with no dependency on an incomplete task.
- Story labels map to spec user stories.
- Tests are required by the constitution; update existing test files rather than creating versioned duplicates.
- Exactly one new dependency (`@supabase/supabase-js`), announced before install.
- Emotional triggers/notes MUST never enter the outbox or remote payloads.
- No individual feature may await network I/O.
- Mark each task `[X]` immediately after completion, and run `tsc` + `jest` before closing a story.
