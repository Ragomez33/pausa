# Phase 0 Research: Personal Data Cloud Backup (Local-First)

Format per decision: **Decision / Rationale / Alternatives considered**.

## R1. Authentication and guest mode

- **Decision**: Use Supabase Auth with email magic links. The app starts in Guest Mode with no account requirement. Linking an account enables backup after explicit consent. Persist the session with `expo-secure-store`; enable `autoRefreshToken` and `persistSession`; exchange the magic-link code in `app/auth/callback.tsx`.
- **Rationale**: Magic links avoid password storage and match the requested email flow. Guest mode preserves the current local-first onboarding. Secure storage keeps refresh tokens out of plaintext async storage.
- **Alternatives considered**: Password auth (more UI and recovery surface); anonymous device auth (cannot recover on a new device); memory-only sessions (forces re-login every launch).

## R2. Local identity, ownership, and UUIDs

- **Decision**: Add `sync_id` UUIDs to `pause_events`, `smoking_events`, `inventory_logs`, and `user_badges`, generated with `expo-crypto.randomUUID()`. Add nullable `owner_user_id` to personal tables, `updated_at` to `user_profile`, and `active_scope` to local `sync_state`. Existing rows are backfilled after migration.
- **Rationale**: Remote upserts require stable identities that survive reinstall and multiple devices. Ownership plus active scope prevents showing or uploading one account's data under another. `updated_at` is required for profile LWW.
- **Alternatives considered**: Autoincrement IDs (collide across devices); a separate mapping table (extra joins everywhere); device-wide unscoped data (account leakage).

## R3. Generic outbox design

- **Decision**: Add `global_sync_outbox` with `id`, `entity_type`, `entity_id`, JSON `payload`, `status` (`pending|sent|failed`), `attempts`, `last_error`, `created_at`, and `updated_at`. A unique `(entity_type, entity_id)` constraint makes enqueue idempotent and lets a newer profile payload replace an older pending one. Team sync keeps its existing outbox.
- **Rationale**: The team outbox is shaped for shared event fields; mixing personal payloads would couple unrelated domains. A JSON payload keeps the engine generic while the entity type selects the remote table. Unique entity keys prevent duplicate queue rows.
- **Alternatives considered**: Reusing `team_event_outbox` (schema mismatch, privacy coupling); one table per entity (more engine branches); in-memory queue (loses data on kill).

## R4. Outbox payload mapping and privacy consent

- **Decision**: Pure builders in `personalSyncPayloads.ts` map local rows to remote rows. `trigger_emotion` and `notes` are included only when `consent_emotions = true`; otherwise they are `null`. Backup itself is gated by `backup_enabled`.
- **Rationale**: Consent is enforced before data leaves the device, not only in the UI. Pure builders are easy to unit test and keep SQL/network code thin.
- **Alternatives considered**: Filtering inside the sync engine (easy to bypass); relying on RLS for consent (RLS cannot know product consent).

## R5. Flush, batching, retries, and idempotency

- **Decision**: `flushPersonalOutbox()` is serialized through a module-level promise chain, checks configured/auth/consent, loads up to 25 pending/failed rows oldest-first, upserts by remote `id`, marks successes, records failures with attempt counts, and stops on fatal auth/RLS/schema errors. Retry triggers: enqueue, app foreground, auth/consent changes, and a 60-second timer while pending.
- **Rationale**: Bounded batches keep the UI responsive and limit request size. Remote upserts make retries safe. A serialized queue prevents overlapping flushes and duplicate work.
- **Alternatives considered**: Parallel uploads (races); background OS tasks (new dependency and platform complexity); no timer (pending work waits indefinitely while the app stays open).

## R6. Restore and checkpointing

- **Decision**: `pullPersonalData()` pages each remote table in chunks of 500, ordered deterministically, and writes locally with conflict-ignore by `sync_id`. It stores per-table checkpoints in `sync_state`. Profile rows apply only when remote `updated_at` is newer than local. No local deletes.
- **Rationale**: Checkpoints let an interrupted restore resume without re-downloading everything, while conflict-ignore prevents duplicates. Local-first merge rules satisfy the append-only and LWW decisions.
- **Alternatives considered**: Full replace (destroys local data); one unbounded request (memory/latency risk); no checkpoints (slow retries).

## R7. Account switching and active scope

- **Decision**: Personal queries and enqueues always filter by `active_scope` (`guest` or a user id). Signing in as a different account changes the active scope, hides other scopes, and blocks uploads for rows not owned by the active account. Linking a guest account offers to adopt guest rows.
- **Rationale**: Satisfies account isolation on a shared device without deleting data. Adopting guest rows lets an existing user keep their history when they create an account.
- **Alternatives considered**: One database file per account (large migration and routing change); clearing local data on switch (data loss); device-wide data (privacy leak).

## R8. Consent and backup preferences

- **Decision**: `sync_state` stores `backup_enabled` (default false) and `consent_emotions` (default false). Disabling backup stops new personal enqueues and flushes but keeps local and remote data. Emotional consent is a separate explicit toggle.
- **Rationale**: Implements the approved 2A decision and the amended constitution. Separate toggles let a person back up non-emotional metrics without sending triggers.
- **Alternatives considered**: One combined toggle (less granular); consent stored only in memory (lost on restart); server-side consent only (cannot block payloads before upload).

## R9. Sync status

- **Decision**: Derive `disabled | pending | syncing | synced | offline | error` from configuration, auth, consent, pending count, and last result. Expose it through a subscription bus consumed by a non-blocking Home chip and the account screen.
- **Rationale**: Mirrors the proven team sync status pattern and satisfies the transparency requirements without blocking screens.
- **Alternatives considered**: Silent sync (poor trust); blocking modal (violates local-first UX); per-row status UI (noise).

## R10. Remote schema and RLS

- **Decision**: Add `supabase/migrations/0002_personal_data_sync.sql` with:
  - `user_profiles` keyed by `auth.uid()`;
  - `smoking_events` with `event_type` (`paused|smoked`), trigger, outcome, notes, duration, inventory flag, and occurred/created timestamps;
  - `inventory_logs` with movement type, quantity, optional packs, cost, and occurred/created timestamps;
  - `user_achievements` with a unique `(user_id, achievement_code)`.
  Enable RLS on all tables with select/insert/update policies using `auth.uid() = user_id`; profile uses `id = auth.uid()`. No delete policies.
- **Rationale**: One remote history table with an event type covers both pauses and smoking sessions while keeping the requested `smoking_events` name. The added fields preserve the local domain data. RLS is the only trustworthy account boundary because the anon key is public.
- **Alternatives considered**: Separate pause/smoking tables (more engine branches); client-only filtering (insecure); delete policies (out of scope).

## R11. Team sync isolation

- **Decision**: Keep `team_event_outbox`, `flushTeamOutbox`, and `shared_events` unchanged. The personal engine has its own status, queue, and triggers.
- **Rationale**: A failure or privacy setting in personal backup must not affect team sharing, and vice versa.
- **Alternatives considered**: One combined engine (couples consent and team data); replacing team sync (regression risk).

## R12. Testing and validation

- **Decision**: Unit-test payload builders and consent, outbox enqueue/upsert semantics/status, active-scope queries, restore deduplication and profile LWW, and auth guard outcomes. Validate `0009` with `node:sqlite`. Validate Auth, magic links, RLS, cross-account denial, remote upserts, and restore manually through `quickstart.md`.
- **Rationale**: Network and auth are external and brittle to mock exhaustively; pure logic and local migrations can be deterministic. The manual guide covers the integration boundary.
- **Alternatives considered**: Extensive Supabase SDK mocks (brittle); no tests (violates constitution §5.6).

## Resolved unknowns

All Technical Context fields are resolved; no `NEEDS CLARIFICATION` markers remain. The three spec gates are resolved by the user's 1A/2A/3A decisions and reflected in constitution 1.1.0.
