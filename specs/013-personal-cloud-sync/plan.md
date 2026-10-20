# Implementation Plan: Personal Data Cloud Backup (Local-First)

**Branch**: `013-personal-cloud-sync` | **Date**: 2026-10-20 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/013-personal-cloud-sync/spec.md`

## Summary

Add an opt-in, account-scoped personal backup layer while keeping SQLite as the sole source of truth for every screen. Personal mutations continue to commit synchronously to SQLite; a generic durable outbox then uploads them asynchronously in batches to Supabase with idempotent upserts. Supabase Auth (email/magic link) provides `auth.uid()` for RLS; the app remains fully usable as a guest. A restore pipeline pulls remote profile, events, inventory, and achievements into SQLite without deleting or overwriting newer local records. The constitution is amended to allow explicit-consent cloud backup of emotional data.

## Technical Context

**Language/Version**: TypeScript 5.9 (`strict: true`), React Native 0.81, Expo SDK 54

**Primary Dependencies**:
- Existing: `@supabase/supabase-js`, Expo Router v6, Drizzle ORM 0.45 + `expo-sqlite` 16, `expo-linking`, NativeWind v4.
- New (must be announced before installation per constitution §5.3): `expo-secure-store` for persisted auth sessions and `expo-crypto` for UUID generation. No other runtime dependencies.

**Storage**:
- Local SQLite via Drizzle: existing personal tables plus `global_sync_outbox`, `sync_state`, and new `sync_id` / `owner_user_id` / `updated_at` columns.
- Remote Supabase Postgres: `user_profiles`, `smoking_events`, `inventory_logs`, `user_achievements`, secured by `auth.uid()` RLS.
- SQLite remains authoritative for all UI reads.

**Testing**: Jest (`jest-expo`). Unit tests for payload mapping, consent gating, account scoping, outbox enqueue/status, conflict resolution, restore deduplication, and query scoping. Migration validation with `node:sqlite`. Supabase Auth, magic-link redirect, RLS, and remote restore validated manually via `quickstart.md`.

**Target Platform**: Mobile (iOS/Android), Expo managed.

**Project Type**: mobile-app with optional authenticated cloud backup.

**Performance Goals**: Local writes and screen reads never wait on the network. Outbox enqueue is one small SQLite write. Flush processes bounded batches (25 records). Restore pages remote data (500 rows) and keeps the UI interactive. Status refresh is derived from counts, not full payload loading.

**Constraints**: Opt-in backup off by default; explicit consent for emotional triggers; guest/local-only mode without registration; no remote deletions in MVP; append-only history; profile LWW by `updated_at`; no blocking spinners; no background OS task; public anon key plus RLS; all local domain storage through Drizzle/SQLite.

**Scale/Scope**: 2 new local tables, 5 existing tables extended, 4 remote tables, 1 auth service, 1 generic sync engine, 1 restore service, 1 account/backup screen, lifecycle integration, and query scoping by active owner.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Constitution / code-rules reference | Status |
|------|--------------------------------------|--------|
| Source under `src/`; `app/` thin routing only | Constitution §1.1/§1.2 | PASS — services/hooks under `src/shared`, account view under `src/modules`, route is thin |
| Domain storage only via Drizzle/SQLite | Constitution §3, code-rules §11/§12 | PASS — outbox, checkpoints, and local hydration all use Drizzle; auth tokens use secure storage, not domain KV |
| SQLite is the single source of truth for UI | Constitution §3 (amended), spec invariants | PASS — reads stay local; write is committed before enqueue |
| Privacy is opt-in with explicit consent | Constitution §3 (amended) | PASS — backup and emotional-trigger upload require separate explicit consent |
| Emotional data leaves device only after consent | Constitution §3 (amended) | PASS — payload builder refuses emotional fields without consent |
| Account isolation enforced server-side | Constitution §3, spec FR-016/017 | PASS — RLS `auth.uid() = user_id`; no service-role key on device |
| Strict typing, no `any`/`unknown` without guards | code-rules §1 | PASS — explicit auth, payload, queue, restore, and status types |
| New dependencies justified | Constitution §5.3 | PASS WITH NOTICE — `expo-secure-store` and `expo-crypto` announced before install |
| Async work not blocking render | code-rules §8, spec FR-001/003/013 | PASS — fire-and-forget enqueue; background batch flush |
| Error handling non-blocking | code-rules §3/§7 | PASS — status surface + toast, queue preserved |
| No heavy dependencies | Feature constraint | PASS — only two focused Expo modules |
| Specs in EARS | Constitution §4 | PASS |
| Remote deletion excluded | Spec FR-030 / decision 3A | PASS — no delete policies or tombstones in MVP |

**Result**: No unresolved violations after the approved 1.1.0 constitution amendment. The two new dependencies must be announced before installation.

**Post-Design Re-evaluation (after Phase 1)**: PASS — the design keeps reads local, gates emotional payloads behind consent, scopes queue and restore by the authenticated owner, and keeps team sync independent.

## Project Structure

### Documentation (this feature)

```text
specs/013-personal-cloud-sync/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 decisions
├── data-model.md        # Local schema, remote schema, merge rules
├── quickstart.md        # Phase 1 validation guide
├── contracts/
│   ├── auth.md          # Guest mode, magic link, session lifecycle
│   ├── supabase.md      # Remote schema, RLS, indexes
│   └── sync.md          # Outbox, payloads, restore, status
└── checklists/
    └── requirements.md  # Spec quality checklist
```

### Source Code (repository root)

```text
supabase/
└── migrations/
    └── 0002_personal_data_sync.sql     # remote tables, indexes, RLS

drizzle/
├── 0009_personal_cloud_sync.sql        # outbox, sync_state, sync_id/owner/updated_at
└── meta/_journal.json

src/
├── services/
│   └── supabase.ts                     # lazy client + persisted auth session + secure storage
├── shared/
│   ├── services/
│   │   ├── authService.ts              # magic link, sign-out, session, account switch guard
│   │   ├── syncEngine.ts               # generic personal outbox flush + status bus
│   │   ├── personalRestore.ts          # initial pull + checkpointed hydration
│   │   └── syncPreferences.ts          # backup opt-in and emotional consent
│   ├── hooks/
│   │   ├── useAuthSession.ts           # auth state for UI
│   │   ├── usePersonalSync.ts          # lifecycle flush trigger + status snapshot
│   │   └── useDatabaseInitialized.ts   # + new tables and UUID backfill
│   ├── constants/
│   │   └── sync.ts                     # batch size, retry, entity types, status copy
│   └── utils/
│       └── personalSyncPayloads.ts      # pure payload builders + consent gate
├── modules/
│   ├── account/
│   │   ├── views/AccountScreen.tsx     # sign-in, backup toggle, consent, status
│   │   ├── hooks/useAccountBackup.ts   # orchestration for the screen
│   │   └── utils/constants.ts          # copy and state labels
│   ├── awareness/hooks/useAwarenessLoop.ts   # enqueue paused event after local commit
│   ├── smoking/hooks/useSmokingSession.ts    # enqueue smoked event after local commit
│   ├── inventory/hooks/useInventory.ts       # enqueue purchase/consumption after local commit
│   ├── badges/hooks/useBadgeEvaluation.ts    # enqueue achievements after unlock
│   └── dashboard/views/DashboardScreen.tsx   # non-blocking backup status entry point
└── db/
    ├── schema.ts                        # extended personal tables + outbox + sync_state
    └── queries.ts                       # scoped reads, outbox, sync_state, restore upserts

app/
├── account/index.tsx                    # thin route -> AccountScreen
└── auth/callback.tsx                    # magic-link callback -> session exchange
```

**Structure Decision**: The external integration boundary stays in `src/services/supabase.ts`. Generic sync/restore/auth orchestration lives in `src/shared/services/` because it spans modules. Account UI is module-specific under `src/modules/account/`. Only thin routes are added under `app/`. Local schema changes go through Drizzle migrations and the bootstrap SQL.

## Implementation Notes

1. **Constitution amendment (done in plan)**: version 1.1.0 allows opt-in personal cloud backup, explicit consent for emotional triggers, append-only UUID history, profile LWW, and excludes remote deletion.
2. **Auth and guest mode**: `supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: 'pausa://auth/callback' } })`. Persist sessions with `expo-secure-store`; enable auto-refresh. Guest mode keeps `active_scope = guest`. Linking an account prompts to adopt guest data or start fresh. `app/auth/callback.tsx` exchanges the magic-link code and routes back.
3. **Local identity and scoping**: add `owner_user_id` (nullable for guest) to personal tables, `updated_at` to `user_profile`, and `sync_id` UUIDs to `pause_events`, `smoking_events`, `inventory_logs`, and `user_badges`. New rows get `expo-crypto.randomUUID()`. Existing rows are backfilled after migration. Add `active_scope` to `sync_state`; personal queries filter by the active scope so one account's local data is not shown under another.
4. **Outbox**: `global_sync_outbox` with `(entity_type, entity_id)` unique, JSON payload, `pending|sent|failed`, attempts, last error, timestamps. Enqueue uses `onConflictDoUpdate` so a profile update replaces its pending payload. Team outbox remains untouched.
5. **Sync engine**: `flushPersonalOutbox()` is serialized, checks configured + authenticated + backup enabled, processes 25 pending rows, maps each entity to its remote table, upserts by `id`, and marks results. Duplicate remote keys are treated as delivered. Network failures keep rows pending/failed; auth/RLS/schema errors surface as a fatal status. Triggers: after enqueue, app foreground, auth/consent change, and a 60-second timer while pending.
6. **Backfill**: when backup is first enabled for an account, run restore first (if the account has remote data), then enqueue only the in-scope local rows that are absent remotely or newer. History rows are idempotent by `sync_id`; the profile is upserted only when local LWW wins.
7. **Restore**: `pullPersonalData()` fetches profile, events, inventory, and achievements in pages of 500, ordered by `created_at`/`id`. Local writes use insert-on-conflict-ignore by `sync_id`; profile updates only when remote `updated_at` is newer than local. Checkpoints live in `sync_state` per table. No deletes. After restore, backfill enqueues only local-only or newer records; the profile is not re-enqueued if the restored remote profile won.
8. **Conflict rules**: history is append-only and immutable; duplicate UUIDs are ignored. Profile uses LWW by `updated_at`. Restore never overwrites a newer local profile or deletes local rows.
9. **Consent**: backup is off by default. Enabling backup writes `backup_enabled = true` only after the user confirms. Emotional triggers are included only when `consent_emotions = true`; otherwise payload builders omit `trigger_emotion` and `notes`. Disabling backup stops enqueue and flush for personal data but does not delete local or remote data.
10. **UI**: add `/account` with sign-in, magic-link state, guest status, backup toggle, emotional consent toggle, pending/synced/error status, last sync, and sign-out. Entry point is a non-blocking backup chip on Home. No screen waits for network to render.
11. **Account switch guard**: changing accounts sets `active_scope` to the new user, hides other scopes from personal queries, and never uploads rows owned by a different account. If the new account has remote data, restore runs after the scope switch.
12. **Tests**: pure payload/consent tests, outbox status, query scoping, restore deduplication/LWW, auth guard behavior, and migration validation. Manual quickstart for magic link, RLS, cross-account denial, offline queue, and restore on a clean install.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Account-scoped local data (`owner_user_id` + active scope) | The spec requires that one account's data is not shown or uploaded under another account on a shared device. | A single device-wide local scope would leak account A data to account B after sign-in. |
| Two new Expo dependencies (`expo-secure-store`, `expo-crypto`) | Secure persisted auth sessions and canonical UUIDs are required for restore/idempotency. | Memory-only sessions force re-login every launch; ad-hoc IDs do not satisfy UUID idempotency. |
| Local schema additions to existing personal tables | Stable cloud identities, ownership, and profile LWW cannot be derived from autoincrement integers alone. | A side mapping table adds joins and complexity for every read/write path. |
