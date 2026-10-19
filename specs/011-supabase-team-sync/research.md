# Phase 0 Research: Supabase Team Sync

Format per decision: **Decision / Rationale / Alternatives considered**.

## R1. Supabase dependency and client

- **Decision**: Add `@supabase/supabase-js` (not `@supabase/supabase-request`) as the only new runtime dependency. Create `src/services/supabase.ts`:
  - read `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` from the Expo environment;
  - export `isSupabaseConfigured()` and `getSupabaseClient(): SupabaseClient | null`;
  - create the client lazily once; return `null` when config is missing/invalid.
- **Rationale**: `supabase-js` is the maintained client and supports database, realtime, and RLS. Lazy creation prevents crashes when env values are absent. The request's `supabase-request` name is not the official package.
- **Alternatives considered**: `supabase-request` (not the official client, no realtime); a custom fetch wrapper (more code, loses realtime); service-role key (secret, forbidden on device).

## R2. Environment and configuration

- **Decision**: Use public Expo variables only. Add `.env` to `.gitignore` (keeping `.env*.local`), document `.env.example` with placeholder values. Never commit real credentials.
- **Rationale**: `EXPO_PUBLIC_*` values are embedded in the app bundle, so they must be public anon credentials protected by RLS. Keeping them out of git avoids accidental leakage.
- **Alternatives considered**: Hardcoding credentials (forbidden); `app.config` secrets (not available at runtime for EXPO_PUBLIC); committing `.env` (leak risk).

## R3. Local outbox durability

- **Decision**: Add a local `team_event_outbox` table via migration `0007_team_sync_outbox.sql`:
  - `id` text PK (event identity)
  - `team_id` text not null
  - `user_name` text not null
  - `event_type` text not null (`posponed|smoked`)
  - `timestamp` text ISO not null
  - `status` text not null (`pending|sent|failed`)
  - `attempts` integer not null default 0
  - `last_error` text nullable
  - `created_at` text ISO not null
  Index on `(status, created_at)`.
- **Rationale**: The requirement says events must survive offline periods and be resent later; in-memory queues lose data on app kill. The outbox is the only new local table.
- **Alternatives considered**: In-memory queue (fails durability); storing events in `pause_events`/`smoking_events` with a sync flag (couples individual history to team sync); AsyncStorage (forbidden for domain data).

## R4. Event creation and privacy

- **Decision**: `enqueueTeamSharedEvent(eventType)`:
  - reads the active local team and the local user name ("Tú");
  - returns without writing when there is no team;
  - creates a unique event id and ISO timestamp;
  - stores only `team_id`, `user_name`, `event_type`, `timestamp` in the outbox;
  - never stores or sends `trigger_emotion` by default.
  Call it after a successful local postponement and after a successful smoking-session record.
- **Rationale**: Satisfies FR-004/005/006 and the constitution's privacy rule (§3). Emotional triggers remain 100% local; the remote `shared_events.trigger_emotion` column stays nullable and unused unless a future consent feature is added.
- **Alternatives considered**: Sending trigger emotions (constitution violation); enqueueing before local success (could share an action that failed locally); queueing without a team (meaningless).

## R5. Flush, retry, and ordering

- **Decision**: `flushTeamOutbox()`:
  - serializes calls through a module-level promise chain;
  - loads pending/failed events oldest-first;
  - upserts each to `shared_events` with the local event id (idempotent);
  - marks success as `sent`, failure as `failed` with an incremented attempt count and error;
  - stops on a fatal configuration/auth error but keeps events queued;
  - runs after enqueue, on app foreground, on dashboard focus, and on a 60-second timer while pending items exist.
- **Rationale**: Idempotent event ids satisfy exact-once semantics; serialization prevents duplicate flushes. No connectivity library is added; failures and lifecycle events drive retries, and a bounded timer catches recovery while the app is open.
- **Alternatives considered**: Parallel sends (duplicate/race risk); `@react-native-community/netinfo` (new dependency); background OS tasks (scope creep); dropping failed events (data loss).

## R6. Realtime subscription

- **Decision**: On the squad dashboard, `useTeamRealtime(teamId)` creates `supabase.channel('team:<id>')` with a `postgres_changes` INSERT listener filtered to `team_id=eq.<id>`. It keeps the inserted rows in state, deduplicates by event id, and removes the channel on unmount/team change. When sharing is disabled, no channel is created.
- **Rationale**: Matches the requested `supabase.channel()` approach, limits traffic to the active team, and cleans up deterministically.
- **Alternatives considered**: Polling (higher latency/load); a global channel for all teams (privacy/noise); no realtime (fails the feature).

## R7. Merging remote events and deduplication

- **Decision**: Keep local snapshots authoritative for the local user ("Tú") and ignore the local user's remote echoes. For other members, derive a view model from remote events:
  - postponed count = remote `posponed` events;
  - smoked today = remote `smoked` events for the local day;
  - streak days = consecutive local days ending today where the member's smoked count is `<= daily_limit` (days with no events count as within limit);
  - had stumble = at least one smoked event on a day within the limit.
  The merged members feed the existing `buildTeamSummary` and `buildLeaderboard`. Deduplicate by event id.
- **Rationale**: Prevents double counting of local actions while giving meaningful remote member metrics. Reuses the existing pure summary/leaderboard functions.
- **Alternatives considered**: Overwrite all local members with remote counts (loses offline actions); never update remote members (fails realtime); write remote events into local snapshots (would require conflict handling and mutate local truth).

## R8. Team/member remote mirroring

- **Decision**: After a successful local create/join, upsert the team and member rows to `teams`/`team_members` when sharing is configured. These upserts are best-effort and never block local success. Cross-device join-by-code remains out of scope; shared events are the only realtime path.
- **Rationale**: Satisfies the requested remote schema without expanding into full cross-device team management.
- **Alternatives considered**: Events-only (remote team rows never exist); full bidirectional team sync (larger scope, conflict/auth work).

## R9. Remote schema and security

- **Decision**: Add `supabase/migrations/0001_team_sync.sql` with the three remote tables, types/constraints, and RLS policies allowing anon read/insert for shared team data while preventing destructive updates. Document that this SQL must be applied to the Supabase project.
- **Rationale**: The client cannot function without the schema; RLS is essential because the anon key is public.
- **Alternatives considered**: Manual dashboard setup only (not reproducible); no RLS (unsafe); service-role key (forbidden).

## R10. Sync status and failure behavior

- **Decision**: Expose a derived status in the dashboard: `disabled` (no config), `offline`/`pending` (queue non-empty or last request failed), `syncing`, `synced` (queue empty), `error`. Failures are non-blocking and keep local data intact.
- **Rationale**: Satisfies FR-016/FR-017 and makes the local-first behavior understandable.
- **Alternatives considered**: Silent failures (poor trust); blocking modal (disproportionate); hiding the status when disabled (confusing).

## R11. Testing and validation

- **Decision**: Unit-test pure helpers: event enqueue eligibility, outbox payload privacy (no trigger emotion), merge/dedupe logic, remote-derived member metrics, and status derivation. Validate migration 0007 with `node:sqlite`. The actual Supabase schema/realtime/RLS are validated through `quickstart.md` against a configured project.
- **Rationale**: The network is external and not available in Jest; pure merge/queue logic is deterministic. Migration validation prevents local data failures.
- **Alternatives considered**: Mocking the Supabase SDK extensively (brittle); no tests (violates constitution §5.6).

## R12. Offline guarantees

- **Decision**: All local flows remain exactly as they are today. Supabase modules must be lazy-loaded/guarded so missing config or failed imports never break individual features. `enqueueTeamSharedEvent` catches all errors and returns a no-op result.
- **Rationale**: The restriction is explicit: the app must remain 100% functional offline for individual functions.
- **Alternatives considered**: Blocking local actions on sync success (violates local-first); requiring login (adds scope).

## Resolved unknowns

All Technical Context fields are resolved; no `NEEDS CLARIFICATION` markers remain. Spec Clarification Gates are resolved by R4 (trigger privacy), R3 (durable outbox), and R8 (remote team/member scope).
