# Implementation Plan: Supabase Team Sync

**Branch**: `011-supabase-team-sync` | **Date**: 2026-10-19 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/011-supabase-team-sync/spec.md`

## Summary

Add an optional Supabase-backed sharing layer for teams while preserving local-first behavior. Team actions (postponed/smoked) are written to a durable local outbox and flushed asynchronously with idempotent event ids. The squad dashboard subscribes to realtime `shared_events` for the active team, merges remote events for other members, and recalculates counters/leaderboard. Missing configuration, offline mode, and remote failures never block individual or local team features. Emotional triggers remain local-only by constitutional constraint.

## Technical Context

**Language/Version**: TypeScript 5.9 (`strict: true`), React Native 0.81, Expo SDK 54

**Primary Dependencies**: `@supabase/supabase-js` (**new**), Expo Router v6, Drizzle ORM 0.45 + expo-sqlite 16, NativeWind v4. No other new dependencies.

**Storage**: Local SQLite outbox `team_event_outbox` via migration `0007_team_sync_outbox.sql`; remote Postgres tables in `supabase/migrations/0001_team_sync.sql`. Local data remains authoritative.

**Testing**: Jest (`jest-expo`). Unit tests for queue payload privacy, remote-member merge/dedupe, streak derivation, sync status, and event eligibility. Migration 0007 validated with `node:sqlite`. Supabase schema/RLS/realtime validated manually via `quickstart.md` against a configured project.

**Target Platform**: Mobile (iOS/Android), Expo managed.

**Project Type**: mobile-app (single frontend project with optional cloud team sharing).

**Performance Goals**: Enqueue is O(1) and synchronous after the local action; flush runs asynchronously in small batches; realtime dashboard updates within 3 seconds; no sync work blocks navigation or initial render.

**Constraints**: 100% offline functionality for individual features; no trigger emotions/notes uploaded; one active team; public anon key + RLS; no background OS task or NetInfo dependency; all local storage through Drizzle/SQLite.

**Scale/Scope**: 1 new local table; 3 remote tables; 1 new service client; 1 sync engine; 1 realtime hook; 2 enqueue integration points; dashboard status/merge updates.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Constitution / code-rules reference | Status |
|------|--------------------------------------|--------|
| Source under `src/`; `app/` thin routing only | Constitution §1.1/§1.2 | PASS — services/sync under `src/`, no route logic |
| Domain storage only via Drizzle/SQLite | Constitution §3, code-rules §11/§12 | PASS — outbox through `src/db`; remote only for shared team data |
| Local-first privacy (emotional triggers local) | Constitution §3 | PASS — `trigger_emotion` excluded from outbox and remote payloads |
| Only aggregate/shared team data syncs | Constitution §3 | PASS — team/member rows + event type/timestamp only |
| Strict typing, no `any`/`unknown` | code-rules §1 | PASS — explicit queue/remote/merge types |
| New dependency justified | Constitution §5.3 | PASS — `@supabase/supabase-js` required for DB/realtime/RLS; notify before install |
| Async work not blocking render | code-rules §8, spec FR-020 | PASS — enqueue after local success; flush in effects/timers |
| Error handling non-blocking | code-rules §3/§7 | PASS — status banner + toast; queue preserved |
| No heavy dependencies | Feature constraint | PASS — one official client only |
| Specs in EARS | Constitution §4 | PASS |

**Result**: No violations. The Supabase dependency must be announced before installation per constitution §5.3.

**Post-Design Re-evaluation (after Phase 1)**: PASS — the outbox is local and privacy-safe, realtime is scoped to the active team, and missing config leaves all individual features untouched. No new violations.

## Project Structure

### Documentation (this feature)

```text
specs/011-supabase-team-sync/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 decisions
├── data-model.md        # Outbox + remote schema + merge model
├── quickstart.md        # Phase 1 validation guide
├── contracts/
│   ├── supabase.md      # Client/env/remote schema contract
│   └── sync.md          # Outbox, flush, realtime, merge contract
└── checklists/
    └── requirements.md  # Spec quality checklist
```

### Source Code (repository root)

```text
.env.example                        # NEW placeholders for public config
.gitignore                          # + .env

supabase/
└── migrations/
    └── 0001_team_sync.sql          # remote tables, indexes, RLS, realtime

src/
├── services/
│   └── supabase.ts                 # lazy client + config guard
├── db/
│   ├── schema.ts                   # + teamEventOutbox
│   ├── queries.ts                  # enqueue/list/mark/count outbox
│   └── 0007 local migration via drizzle/0007_team_sync_outbox.sql
├── modules/
│   ├── awareness/hooks/useAwarenessLoop.ts  # enqueue 'posponed'
│   ├── smoking/hooks/useSmokingSession.ts   # enqueue 'smoked'
│   └── team/
│       ├── sync/teamSync.ts        # enqueue/flush/status/subscription bus
│       ├── sync/useTeamRealtime.ts # supabase.channel subscription
│       ├── sync/mergeRemoteEvents.ts
│       ├── sync/syncStatus.ts
│       ├── hooks/useTeamDashboard.ts  # merge + status
│       ├── utils/service.ts           # best-effort team/member mirror
│       └── views/TeamScreen.tsx       # status banner
└── shared/hooks/useDatabaseInitialized.ts  # + outbox bootstrap SQL

drizzle/
├── 0007_team_sync_outbox.sql
└── meta/_journal.json
```

**Structure Decision**: The Supabase client lives at the requested `src/services/supabase.ts` because it is an external integration boundary. Team-specific sync, merge, and realtime logic stays in `src/modules/team/sync/`. The outbox is Drizzle/SQLite to preserve local-first durability. No individual feature imports Supabase directly.

## Implementation Notes

1. **Dependency/config**: install `@supabase/supabase-js` after notifying. Add `.env.example` and ignore `.env`. `src/services/supabase.ts` returns `null`/`false` when env values are absent or malformed.
2. **Remote SQL**: create `supabase/migrations/0001_team_sync.sql` with `teams`, `team_members`, `shared_events`, indexes, RLS policies, and `alter publication supabase_realtime add table shared_events`.
3. **Outbox migration**: `0007_team_sync_outbox.sql` creates the local queue + `(status, created_at)` index. Update schema, queries, journal, `migrations.js`, and bootstrap SQL.
4. **Outbox API**: `enqueueTeamEvent`, `listPendingTeamEvents`, `markTeamEventSent`, `markTeamEventFailed`, `countPendingTeamEvents`.
5. **Sync engine**: `enqueueTeamSharedEvent(type)` reads the active team, creates a unique id/ISO timestamp, skips when no team/config, and enqueues only team/user/type/timestamp. `flushTeamOutbox` is serialized, FIFO, idempotent (remote upsert by event id), and returns status/error. Retry on enqueue, app foreground, dashboard focus, and a 60-second timer while pending.
6. **Integrations**: after successful local postponement call `enqueueTeamSharedEvent('posponed')`; after successful session record call `'smoked'`. Both fire-and-forget and never affect local success.
7. **Team mirroring**: after local create/join, best-effort upsert team/member rows when configured; failures are ignored for local success.
8. **Realtime**: `useTeamRealtime(teamId)` subscribes to INSERTs on `shared_events` filtered by team, dedupes by id, and cleans up on team change/unmount.
9. **Merge**: `mergeRemoteMembers` keeps local snapshot values for "Tú", derives other members' postponed/smoked/streak/stumble from remote events, ignores unknown users, and feeds the existing summary/leaderboard.
10. **Dashboard**: extend `useTeamDashboard` with outbox/realtime/status; `TeamScreen` shows a non-blocking sync status banner and refreshes automatically on realtime events.
11. **Tests**: unit-test enqueue payload privacy/eligibility, merge/dedupe/metrics, status derivation, and remote member streaks; validate migration 0007; manual quickstart for Supabase.

## Complexity Tracking

> No constitution violations; section intentionally empty.
