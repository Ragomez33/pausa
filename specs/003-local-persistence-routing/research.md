# Phase 0 Research: Local Persistence & Startup Routing

Format per decision: **Decision / Rationale / Alternatives considered**.

## R1. Persistence layer location (`src/db/` vs `src/shared/db/`)

- **Decision**: Consolidate the persistence layer at `src/db/` (`schema.ts`, `client.ts`, `queries.ts`,
  `mappers.ts`) and update every consumer import. Remove `src/shared/db/` once all imports are migrated.
- **Rationale**: The feature explicitly requires `src/db/`. The constitution (§1.1) mandates source under
  `src/` but does not enumerate a database folder; §1.2 restricts module business/presentation logic, while
  the database client and schema are cross-cutting infrastructure shared by all modules. Keeping two
  Drizzle instances/schemas would risk divergent migrations and duplicate SQLite connections.
- **Alternatives considered**: Keeping `src/shared/db/` and adding `src/db/` as a re-export facade
  (duplicate surface, confusing ownership); keeping both layers (two schema sources of truth, forbidden
  drift risk); per-module databases (fragments the single local database).
- **Supersedes**: `specs/002-onboarding-pause-flow/research.md` R2 for this feature. The explicit feature
  requirement and the absence of a constitution-mandated `db` path justify the move.

## R2. Target schema and migration strategy

- **Decision**: Define the final shapes exactly as requested:
  - `user_profile`: `id`, `daily_cigarettes` (integer, not null), `pack_cost` (real, not null),
    `currency` (text, not null), `quit_goal` (text, not null), `created_at` (text ISO, not null).
  - `pause_events`: `id`, `timestamp` (text ISO, not null), `trigger_emotion` (text, not null),
    `resisted` (integer boolean 0/1, not null), `notes` (text, nullable).
  Generate migration `drizzle/0002_*.sql` and hand-verify it converts existing rows:
  - Rebuild `user_profile` without the unused scaffold columns (`display_name`, `daily_target`,
    `smoke_interval_minutes`, `pack_size`, `updated_at`).
  - Convert integer epoch-millisecond `created_at` values to ISO-8601 text via
    `strftime('%Y-%m-%dT%H:%M:%fZ', created_at / 1000.0, 'unixepoch')`.
  - Default legacy `NULL` quit goals to an empty string to satisfy `NOT NULL`.
  - Rebuild `pause_events` renaming `created_at` to `timestamp`, converting values to ISO text, and
    recreating the DESC index on `timestamp`.
  - Preserve primary keys and record counts.
- **Rationale**: Satisfies the requested schema without silently discarding previously stored profiles or
  pause events (spec Clarification Gate 1). Rebuilding is the SQLite-safe way to drop/rename columns with
  data conversion.
- **Alternatives considered**: Additive `ALTER TABLE` only (leaves unwanted columns and integer
  timestamps); drop and recreate tables (data loss, rejected); keep integer timestamps (violates the
  requested text ISO contract).

## R3. Asynchronous initialization without blocking first render

- **Decision**: Create the client once at module load with `openDatabaseSync('pausa.db')` and
  `drizzle(expoDatabase, { schema })`, as explicitly required. Run all schema setup and profile
  detection after mount:
  - `useMigrations(db, migrations)` applies versioned migrations asynchronously.
  - An effect then executes idempotent `CREATE TABLE IF NOT EXISTS` statements through
    `expoDatabase.execAsync(...)` as a safety net for databases without migration bookkeeping.
  - Profile existence is read through Drizzle inside the same effect and stored in React state.
  - Domain reads/writes are wrapped in async hooks/event handlers, never executed during render.
- **Rationale**: `openDatabaseSync` is mandated by the request and is cheap at module scope. expo-sqlite
  cannot provide an async Drizzle driver while keeping the requested `openDatabaseSync` client, so
  "asynchronous" is interpreted as "never on the initial render path, always awaited inside effects or
  submit handlers." The loading indicator remains responsive throughout.
- **Alternatives considered**: `openDatabaseAsync` (contradicts explicit requirement); top-level queries
  during render (blocks first paint); adding a query/state library (unnecessary dependency).

## R4. Startup routing and redirect ownership

- **Decision**: `app/_layout.tsx` owns startup routing. While `ready === false` it renders only a loading
  indicator. Once ready, it uses `useSegments()` + `router.replace('/onboarding')` when no profile exists
  and the current segment is not `onboarding`. When a profile exists, the app renders the normal stack and
  `/` shows home. `Redirect` is not rendered unconditionally because the onboarding route must remain
  reachable without causing a redirect loop.
- **Rationale**: Keeps the redirect tied to verified storage state, avoids a flash of home content, and
  respects the thin-router rule (no DB logic in routes). FR-007/FR-008 and FR-014 are enforced globally.
- **Alternatives considered**: Home-only guard (race with layout; duplicate logic); unconditional
  `<Redirect>` in the root layout (loop when already on onboarding); a global state library (overkill).
  The onboarding screen still revalidates on submit so direct entry cannot create a duplicate profile.

## R5. Single-profile enforcement

- **Decision**: `useOnboardingProfile.submit` first checks for an existing profile. If one exists, it does
  not insert and resolves successfully (then routes home). Otherwise it validates once more, maps the form
  to an insert payload, and calls `db.insert(userProfile).values(...).returning().get()` (or `.run()`).
  The submit handler is async and disables the button while pending.
- **Rationale**: Guarantees FR-010/FR-013 and prevents double-tap duplicates. Keeps at most one profile
  row, matching the single-user product model.
- **Alternatives considered**: Unique index on a synthetic key (unneeded for a single-row table); upsert on
  every submit (replaces history silently); allowing multiple profiles (out of scope).

## R6. ISO text timestamps and ordering

- **Decision**: Store `user_profile.created_at` and `pause_events.timestamp` as ISO-8601 UTC strings
  generated with `toISOString()`. Historical getters order by `desc(pauseEvents.timestamp)`.
- **Rationale**: ISO-8601 UTC strings sort lexicographically in the same order as chronological time, so
  SQLite `ORDER BY` remains correct without parsing. Satisfies code-rules §11 (DESC historical logs) and
  the requested text schema.
- **Alternatives considered**: Integer epoch milliseconds (contradicts the request); local-time strings
  (ambiguous ordering across time zones/DST).

## R7. Validation and error communication

- **Decision**: Keep zod validation as the single validation source, with rules
  `dailyCigarettes`: positive integer; `packCost`: numeric `>= 0`; `currency`: non-empty; `quitGoal`:
  trimmed string up to 280 characters (required by the schema, so an empty value is stored as a default
  goal constant). Failures and storage errors go through `showAppToast`; no inline field text. Numeric
  parsing happens in a pure mapper, never inside the try/catch.
- **Rationale**: code-rules §3/§7/§8. The spec's edge cases (zero/negative/non-numeric) are covered by
  the same schema used for both UI and insert safety.
- **Alternatives considered**: Inline errors (forbidden); raw `Number()` casts without validation (allows
  `NaN`); duplicating validation in the screen (drift risk).

## R8. Migration bootstrap and failure behavior

- **Decision**: `useDatabaseInitialized` returns `{ ready, hasProfile, error }`. On migration/setup
  failure it first attempts the idempotent bootstrap DDL once; if that also fails, `ready` stays `false`
  and `error` is populated. The root layout renders a clear Spanish error message instead of the app
  stack. No partial profile is written because inserts are a single atomic statement.
- **Rationale**: Satisfies FR-012, SC-007, and the "storage unavailable" edge case. The fallback covers
  databases whose migration journal is missing but whose tables can be safely ensured.
- **Alternatives considered**: Swallowing errors and showing empty app (silent data loss); auto-deleting
  the database on failure (destructive, rejected).

## Resolved unknowns

All Technical Context fields are resolved; no `NEEDS CLARIFICATION` markers remain. The three spec
Clarification Gates are resolved as follows: preserve existing data (R2), enforce a single profile (R5),
and consolidate the persistence layer at `src/db/` (R1).
