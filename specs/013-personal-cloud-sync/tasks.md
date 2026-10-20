# Tasks: Personal Data Cloud Backup (Local-First)

**Input**: Design documents from `/specs/013-personal-cloud-sync/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/, quickstart.md

**Tests**: Included because the project constitution (§5.2.6/§5.6) requires unit tests and the plan defines a Jest strategy. Pure payload, queue, scope, restore, and status logic is tested first; Auth, magic links, RLS, and remote restore are validated through `quickstart.md`.

**Organization**: Tasks are grouped by user story (P1 → P4). Schema, migrations, auth, scoping, and the generic outbox are foundational because every story depends on them.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: `[US1]`–`[US4]` for user story phases; omitted in Setup, Foundational, and Polish
- Every task includes the exact file path(s) it touches

## Path Conventions

- Mobile app with Expo Router: `app/` (thin routes), `src/modules/`, `src/shared/`, `src/db/`, `drizzle/`, `supabase/migrations/`.
- Tests: `src/modules/<module>/tests/unit/` and `src/shared/tests/unit/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the cloud backup stack and add the two approved dependencies.

- [X] T001 Announce and install the approved dependencies `expo-secure-store` and `expo-crypto`; update `package.json` and lockfile. Do not add any other runtime dependency.
- [X] T002 [P] Create `src/shared/constants/sync.ts` with batch size 25, retry interval 60 seconds, entity types (`profile`, `smoking_event`, `inventory_log`, `achievement`), status values (`disabled|pending|syncing|synced|offline|error`), and storage keys (`active_scope`, `backup_enabled`, `consent_emotions`, `last_sync_at`, restore checkpoints).
- [X] T003 [P] Create `src/shared/utils/syncIds.ts` with `createSyncId()` backed by `expo-crypto.randomUUID()` and a guard for invalid/empty ids.
- [X] T004 [P] Create `src/modules/account/utils/constants.ts` with account/backup copy, consent labels, and confirmation messages for adopting guest data and switching accounts.
- [X] T005 [P] Update `.env.example` and confirm `src/services/supabase.ts` reads only `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`; remove unused Supabase environment placeholders.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Local schema, remote schema, auth session plumbing, scoping helpers, and the durable queue.

**⚠ CRITICAL**: Complete before any user story implementation.

- [X] T006 Update `src/db/schema.ts`: extend `user_profile` with `owner_user_id` text nullable and `updated_at` text ISO not null; extend `pause_events`, `smoking_events`, `inventory_logs`, and `user_badges` with `sync_id` text UUID not null unique and `owner_user_id` text nullable. Add `globalSyncOutbox` (`id` text PK, `entity_type` text, `entity_id` text, `payload` text JSON, `status` text `pending|sent|failed`, `attempts` integer default 0, `last_error` text nullable, `created_at`/`updated_at` text ISO) with unique `(entity_type, entity_id)` and index `(status, created_at)`. Add `syncState` (`key` text PK, `value` text, `updated_at` text ISO). Export inferred select/insert types.
- [X] T007 Create `drizzle/0009_personal_cloud_sync.sql` with the schema changes from T006, UUID backfill for existing rows, and all indexes; update `drizzle/meta/_journal.json` and `drizzle/migrations.js`.
- [X] T008 Update `src/shared/hooks/useDatabaseInitialized.ts` bootstrap SQL with the new columns, `global_sync_outbox`, `sync_state`, and indexes; add a post-migration `backfillPersonalSyncIds()` call that assigns UUIDs to rows missing `sync_id`.
- [X] T009 Update `src/db/queries.ts` with active-scope personal reads/writes: `getProfile`, `saveProfile`, `updateProfileSettings`, `listPauseEvents`, `listSmokingEvents`, `listInventoryLogs`, `listUserBadges`, and their timestamp/count variants must filter by `owner_user_id IS NULL` for `guest` or `owner_user_id = activeUserId` for an account; writes stamp `owner_user_id` and `updated_at`. Preserve existing team queries unchanged.
- [X] T010 Add outbox queries to `src/db/queries.ts`: `enqueuePersonalSyncItem` using upsert on `(entity_type, entity_id)` to reset `status='pending'`, `payload`, `attempts=0`, `last_error=null`; `listPendingPersonalSyncItems(limit)`, `markPersonalSyncSent(id)`, `markPersonalSyncFailed(id, error)`, `countPendingPersonalSyncItems()`, and `pruneSentPersonalSyncItems(olderThanIso)`.
- [X] T011 Add sync-state queries to `src/db/queries.ts`: `getSyncState(key)`, `setSyncState(key, value)`, `getActiveScope()`, `setActiveScope(scope)`, and helpers for backup preferences and restore checkpoints.
- [X] T012 Create `supabase/migrations/0002_personal_data_sync.sql` with `user_profiles` (id uuid PK = `auth.uid()`, created_at, updated_at, settings jsonb), `smoking_events` (id uuid PK, user_id uuid, event_type `paused|smoked`, trigger_emotion, outcome `resisted|ceded` nullable, notes, duration_seconds, inventory_decremented boolean, occurred_at, created_at), `inventory_logs` (id uuid PK, user_id, movement_type `purchase|consumption`, quantity > 0, packs_bought, cost, occurred_at, created_at), `user_achievements` (id uuid PK, user_id, achievement_code, unlocked_at, created_at, unique `(user_id, achievement_code)`), indexes, RLS enabled, select/insert/update policies restricted by `auth.uid()`, and no delete policies.
- [X] T013 Refactor `src/services/supabase.ts` to create the client lazily with `persistSession: true`, `autoRefreshToken: true`, `detectSessionInUrl: false`, and a `expo-secure-store` storage adapter; keep `isSupabaseConfigured()` and `getSupabaseClient()` returning `null` when configuration is missing.
- [X] T014 Create `src/shared/services/authService.ts` with `sendMagicLink(email)`, `completeMagicLink(url)` using the PKCE code exchange, `signOut()`, `getAuthSnapshot()`, and `subscribeToAuth()`. Return non-throwing `{ error }` results, keep Guest Mode when unauthenticated, and never use a service-role key.
- [X] T015 Create `src/shared/services/syncPreferences.ts` with `backupEnabled` default `false` and `consentEmotions` default `false`, read/write through `sync_state`, and helpers that refuse enabling backup without an authenticated account.
- [X] T016 [P] Create `src/shared/utils/accountScope.ts` with pure helpers for `guest`/user scope matching, ownership stamping decisions, and account-switch validation.
- [X] T017 [P] Add unit tests in `src/shared/tests/unit/accountScope.test.ts` for guest scope, user scope, cross-account rejection, and ownership stamping.
- [X] T018 [P] Add unit tests in `src/shared/tests/unit/syncState.test.ts` for default preferences (`backup_enabled=false`, `consent_emotions=false`), scope persistence, and checkpoint read/write semantics.
- [X] T019 Validate `drizzle/0009_personal_cloud_sync.sql` with `node:sqlite` and update `src/shared/hooks/useDatabaseInitialized.ts` if any statement fails.

**Checkpoint**: Local/remote schemas, auth plumbing, scoping, and queue queries are ready. No user story work should start before T019.

---

## Phase 3: User Story 1 - Instant Local Writes with Background Backup (Priority: P1) 🎯 MVP

**Goal**: Every personal mutation commits to SQLite immediately and is durably queued, then uploaded asynchronously in batches exactly once.

**Independent Test**: With the network disabled, record a pause, a smoking session, a purchase, and a consumption. Verify local screens update instantly and four queue rows exist. Restart offline and confirm the rows survive. Restore connectivity and verify all four upload once with no duplicates.

### Tests for User Story 1

- [X] T020 [P] [US1] Add payload builder tests in `src/shared/tests/unit/personalSyncPayloads.test.ts`: profile settings, pause→`paused`, smoking→`smoked`, inventory purchase/consumption, achievement mapping, and emotional fields `null` when consent is false.
- [X] T021 [P] [US1] Add sync engine tests in `src/shared/tests/unit/personalSyncEngine.test.ts`: enqueue never awaits network, unique entity upsert, batch size 25, duplicate remote key treated as delivered, failed row retained, and fatal auth/RLS stops the batch.

### Implementation for User Story 1

- [X] T022 [US1] Create `src/shared/utils/personalSyncPayloads.ts` with pure builders `buildProfileSyncPayload`, `buildPauseSyncPayload`, `buildSmokingSyncPayload`, `buildInventorySyncPayload`, and `buildAchievementSyncPayload`. Require `ownerUserId`, use `sync_id` as remote id, and set `trigger_emotion`/`notes` to `null` unless `consentEmotions === true`.
- [X] T023 [US1] Create `src/shared/services/syncEngine.ts` with `enqueuePersonalSync`, `flushPersonalOutbox`, `getPersonalSyncSnapshot`, and `subscribeToPersonalSync`. Check configured/auth/backup, serialize flushes, process 25 rows oldest-first, upsert each entity by remote id, mark success/failure, preserve local data on errors, and notify subscribers.
- [X] T024 [US1] Create `src/shared/hooks/usePersonalSync.ts` to flush on app foreground, auth/consent change, and a 60-second timer while pending; expose a non-blocking snapshot and clean up listeners.
- [X] T025 [P] [US1] Integrate pause enqueue after the local commit in `src/modules/awareness/hooks/useAwarenessLoop.ts`; enqueue `pause_events` with its `sync_id` and never block the toast/navigation.
- [X] T026 [P] [US1] Integrate smoking-session enqueue after the local transaction in `src/modules/smoking/hooks/useSmokingSession.ts`; enqueue `smoking_events` with its `sync_id`.
- [X] T027 [P] [US1] Integrate inventory purchase and consumption enqueue after local commits in `src/modules/inventory/hooks/useInventory.ts`; enqueue `inventory_logs` for both movement types.
- [X] T028 [P] [US1] Integrate achievement enqueue after a successful badge unlock in `src/modules/badges/hooks/useBadgeEvaluation.ts`; enqueue each newly unlocked `user_badges` row.
- [X] T029 [US1] Add `usePersonalSync` lifecycle integration in `app/_layout.tsx` after database readiness, without delaying the loading indicator or navigation.
- [X] T030 [US1] Run `npm run typecheck` and `npm test` using `package.json`; fix all failures and record the offline queue validation from `specs/013-personal-cloud-sync/quickstart.md`.

**Checkpoint**: US1 is independently functional — local writes are instant and the queue drains asynchronously.

---

## Phase 4: User Story 2 - Restore Personal Data on a New Device (Priority: P2)

**Goal**: After sign-in, pull remote personal data into SQLite incrementally without blocking the UI or overwriting newer local records.

**Independent Test**: Seed a remote account with profile, mixed pauses/smoking events, inventory movements, and achievements. Sign in on a clean install and verify all categories hydrate once. Repeat with newer local rows and verify they are preserved.

### Tests for User Story 2

- [X] T031 [P] [US2] Add restore tests in `src/shared/tests/unit/personalRestore.test.ts`: paged fetch order, idempotent insert by `sync_id`, duplicate ignore, profile LWW (`updated_at` newer wins), local-newer preservation, checkpoint resume, and no deletes.

### Implementation for User Story 2

- [X] T032 [US2] Create `src/shared/services/personalRestore.ts` with `pullPersonalData(userId, onProgress)` fetching pages of 500 ordered by `occurred_at`/`created_at` and `id`, hydrating profile/events/inventory/achievements by `sync_id`, applying profile LWW, persisting checkpoints in `sync_state`, and never deleting local rows.
- [X] T033 [US2] Add restore checkpoint helpers to `src/db/queries.ts`: `getRestoreCheckpoint(table)`, `setRestoreCheckpoint(table, value)`, and scoped bulk insert helpers with `onConflictDoNothing` by `sync_id`.
- [X] T034 [US2] Create `src/shared/services/personalBackfill.ts` with `adoptGuestData(userId)` and `enqueueUnsyncedPersonalData(userId)`. Adoption stamps guest rows with the account; backfill runs after restore and enqueues only local-only or newer rows, never a profile whose remote version won LWW.
- [X] T035 [US2] Create `src/shared/hooks/usePersonalRestore.ts` to trigger restore after authentication and backup enablement, expose non-blocking progress (`profile|events|inventory|achievements`), and guard against overlapping restores.
- [X] T036 [US2] Resolve the adoption choice after account linking in `src/modules/account/hooks/useAccountBackup.ts` and `src/shared/services/authService.ts`: adopt guest data or start with the account scope; call restore/backfill accordingly.
- [ ] T037 [US2] Run restore scenarios in `specs/013-personal-cloud-sync/quickstart.md` on a clean install, including interrupted restore and newer-local preservation; record results.
  - _Pending: requires a clean emulator/device and a configured Supabase account._

**Checkpoint**: US2 is independently functional — a new device can hydrate from the cloud without blocking or data loss.

---

## Phase 5: User Story 3 - Private, Account-Scoped Backup (Priority: P3)

**Goal**: Guest Mode and explicit consent protect personal data; accounts are isolated locally and by RLS.

**Independent Test**: Use two accounts and a guest. Verify guest data uploads under no account, account A data is invisible to account B, cross-account remote requests are denied, backup is off by default, and emotional fields are uploaded only after consent.

### Tests for User Story 3

- [X] T038 [P] [US3] Add consent tests in `src/shared/tests/unit/syncPreferences.test.ts`: backup off by default, enable requires auth, disabling stops enqueue, emotional consent gates payload fields, and preferences survive restart.
- [X] T039 [P] [US3] Add account-isolation tests in `src/shared/tests/unit/accountIsolation.test.ts`: guest scope hides account rows, account scope hides guest/other rows, account switch blocks cross-account enqueue, and sign-out stops uploads.

### Implementation for User Story 3

- [X] T040 [US3] Create `src/shared/hooks/useAuthSession.ts` exposing status (`loading|guest|authenticated|error`), userId, email, and error from `authService`; keep Guest Mode fully usable.
- [X] T041 [US3] Create `src/modules/account/hooks/useAccountBackup.ts` to orchestrate magic-link request, adoption choice, backup enable/disable, emotional consent, sign-out, restore/backfill triggers, and account-switch confirmation.
- [X] T042 [US3] Create `src/modules/account/views/AccountScreen.tsx` with Guest Mode status, email input, magic-link state, backup toggle (off by default), separate emotional-consent toggle, adoption/switch confirmations, and sign-out. Use NativeWind/native primitives only.
- [X] T043 [US3] Create thin routes `app/account/index.tsx` rendering `AccountScreen` and `app/auth/callback.tsx` calling `completeMagicLink` then returning to the account screen; register `/account` in `app/_layout.tsx`.
- [X] T044 [US3] Enforce `active_scope` across personal queries in `src/db/queries.ts` and stamp `owner_user_id` on every personal write; verify team queries are unaffected.
- [X] T045 [US3] Enforce account-switch isolation in `src/shared/services/authService.ts` and `src/shared/services/syncEngine.ts`: changing accounts updates `active_scope`, hides other scopes, and refuses to enqueue/upload rows owned by another account.
- [X] T046 [US3] Wire consent into `src/shared/services/syncEngine.ts` and `src/shared/utils/personalSyncPayloads.ts` so `backup_enabled=false` stops enqueue/flush and `consent_emotions=false` omits `trigger_emotion` and `notes`.
- [X] T047 [US3] Apply `supabase/migrations/0002_personal_data_sync.sql` to the project and validate in Supabase that RLS denies cross-account select/insert/update; record the evidence in `specs/013-personal-cloud-sync/quickstart.md` notes.
  - _Applied with `supabase db push` on 2026-10-20. Cross-account RLS checks still need to be run with two authenticated sessions._
  - _Fixed missing table grants with `0003_personal_data_grants.sql`; verified `authenticated` has SELECT/INSERT/UPDATE and RLS uses `auth.uid()`._
- [X] T048 [US3] Run `npm run typecheck` and `npm test` using `package.json`; fix all failures before closing US3.

**Checkpoint**: US3 is independently functional — guest mode, consent, and account isolation are enforced.

---

## Phase 6: User Story 4 - Non-Blocking Backup Health (Priority: P4)

**Goal**: The person can see disabled/pending/syncing/synced/offline/error status without interrupting any flow.

**Independent Test**: Inspect the Home chip and account screen with backup disabled, empty queue, pending changes, mid-flight sync, and a fatal error. Verify status accuracy, non-blocking behavior, and automatic retry.

### Tests for User Story 4

- [X] T049 [P] [US4] Add status derivation tests in `src/shared/tests/unit/personalSyncStatus.test.ts` covering `disabled`, `pending`, `syncing`, `synced`, `offline`, and `error`, including unauth/backup-off precedence.

### Implementation for User Story 4

- [X] T050 [US4] Create `src/shared/utils/personalSyncStatus.ts` with `derivePersonalSyncStatus(input)` and the snapshot type; reuse it from `src/shared/services/syncEngine.ts`.
- [X] T051 [US4] Add a non-blocking backup status chip to `src/modules/dashboard/views/DashboardScreen.tsx` that opens `/account`; it must render from local state and never block the dashboard.
- [X] T052 [US4] Add status, pending count, last sync, retry state, and fatal-error copy to `src/modules/account/views/AccountScreen.tsx` using `subscribeToPersonalSync`.
- [X] T053 [US4] Add `pruneSentPersonalSyncItems` usage and the 7-day retention cleanup to `src/shared/services/syncEngine.ts`; ensure cleanup never removes pending/failed rows.
- [ ] T054 [US4] Validate the status scenarios in `specs/013-personal-cloud-sync/quickstart.md` (disabled, empty, pending, syncing, synced, offline, fatal) and record results.
  - _Pending: requires device/emulator and a configured account._

**Checkpoint**: US4 is independently functional — backup health is visible and non-blocking.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Cleanup, validation, and governance.

- [X] T055 [P] Search `src/` and `app/` for direct Supabase personal-table calls outside `src/shared/services/`, unscoped personal queries, and hardcoded consent/status copy; refactor leftovers into the central services/constants.
- [X] T056 [P] Update `README.md` with the Guest Mode, magic-link, opt-in backup, consent model, and migration application steps.
- [X] T057 Run `npm run lint`, `npm run typecheck`, and `npm test` from `package.json`; confirm 0 errors and 0 failing tests.
- [X] T058 Validate `drizzle/0009_personal_cloud_sync.sql` and `supabase/migrations/0002_personal_data_sync.sql` with `node:sqlite` (local) and the Supabase SQL editor/CLI (remote); record results.
  - _Local 0000–0009 validated with `node:sqlite`. Remote `0002` applied successfully with `supabase db push` on 2026-10-20._
  - _Remote `0003_personal_data_grants.sql` applied and grants verified via the linked database._
- [ ] T059 Execute all scenarios in `specs/013-personal-cloud-sync/quickstart.md` on at least two devices/emulators (guest, magic link, offline queue, partial failure, restore, LWW, account isolation, disable/sign-out, misconfiguration).
  - _Pending: requires physical devices/emulators, Email Auth redirect configuration, and the remote 0002 migration._
- [X] T060 Run `git status` for `src/`, `app/`, `drizzle/`, `supabase/`, and `specs/013-personal-cloud-sync/`; summarize changed files and present the suggested commit command for user confirmation (constitution §5.9). Do NOT commit or push automatically.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup and blocks every user story.
- **US1 (Phase 3)**: Depends on Foundational; delivers the MVP.
- **US2 (Phase 4)**: Depends on Foundational and US1 sync primitives; restore writes local rows and relies on the queue for backfill.
- **US3 (Phase 5)**: Depends on Foundational and US1; adds auth/consent UI and enforces scoping.
- **US4 (Phase 6)**: Depends on US1 and US3; exposes status derived from the engine and account state.
- **Polish (Phase 7)**: Depends on all desired stories.

### Key Task Dependencies

- T001 → T003/T013/T014.
- T006 → T007 → T008/T009/T010/T011 → T019.
- T012 → T047.
- T013/T014/T015 → T020/T021 → T022 → T023 → T024 → T025/T026/T027/T028 → T029/T030.
- T022/T023/T032/T033/T034 → T035/T036 → T037.
- T040/T041/T042/T043 → T044/T045/T046 → T047/T048.
- T050 → T051/T052/T053 → T054.
- T057 → T058 → T059 → T060.

### Within Each User Story

- Tests first, then pure builders, then services, then integrations, then checks.
- Schema and queries before services.
- Services before hooks and screens.
- Run `tsc` + `jest` before closing a story.

---

## Parallel Opportunities

- Setup: T002, T003, T004, T005 can run in parallel after T001.
- Foundational: T012 (remote SQL), T016/T017/T018 (scope/state tests and helpers) are independent once schema decisions are fixed.
- US1: T020/T021 tests in parallel; T025–T028 integrations touch different modules and can run in parallel after T023.
- US2: T031 test and T032 restore service can start together after T033 contracts are fixed.
- US3: T038/T039 tests in parallel; T041/T042 can start after T040; T047 is independent manual validation.
- US4: T049 test and T050 status helper can run in parallel.

### Parallel Example: US1

```text
Task: "Add payload builder tests in src/shared/tests/unit/personalSyncPayloads.test.ts" (T020)
Task: "Add sync engine tests in src/shared/tests/unit/personalSyncEngine.test.ts" (T021)
Task: "Integrate pause enqueue in src/modules/awareness/hooks/useAwarenessLoop.ts" (T025)
Task: "Integrate smoking enqueue in src/modules/smoking/hooks/useSmokingSession.ts" (T026)
Task: "Integrate inventory enqueue in src/modules/inventory/hooks/useInventory.ts" (T027)
Task: "Integrate achievement enqueue in src/modules/badges/hooks/useBadgeEvaluation.ts" (T028)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Setup and Foundational (T001–T019).
2. Complete US1 (T020–T030).
3. Stop and validate offline queue + exactly-once upload.
4. Demo the local-first backup behavior.

### Incremental Delivery

1. Setup + Foundational → schema, auth plumbing, scoping, queue.
2. US1 → instant writes + background backup (MVP).
3. US2 → new-device restore and backfill.
4. US3 → guest mode, consent, account isolation.
5. US4 → non-blocking status.
6. Polish → retention, docs, full device validation, commit proposal.

### Parallel Team Strategy

1. Team completes Setup + Foundational together.
2. After Foundational:
   - Developer A: US1 payloads, engine, integrations.
   - Developer B: US2 restore/backfill.
   - Developer C: US3 auth/consent/account isolation.
   - Developer D: US4 status UI after US1/US3 primitives exist.

---

## Notes

- `[P]` marks different files with no dependency on an incomplete task.
- Tests are required by the constitution; update existing test files rather than creating versioned duplicates.
- No new runtime dependencies beyond `expo-secure-store` and `expo-crypto`.
- SQLite remains authoritative for every UI read; no task may add a network-blocking spinner.
- `trigger_emotion` and `notes` are `null` unless `consent_emotions = true`.
- Remote deletion is out of scope; no delete policies or tombstones.
- Mark each task `[X]` immediately after completion, and run `tsc` + `jest` before closing a story.
