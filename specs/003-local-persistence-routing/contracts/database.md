# Contract: Local Persistence

Single sanctioned persistence interface for domain entities (constitution §3). Local-only; no network.

## Modules

- `src/db/schema.ts` — `userProfile` and `pauseEvents` tables plus inferred types.
- `src/db/client.ts` — `DATABASE_NAME = 'pausa.db'`, `expoDatabase = openDatabaseSync(...)`, and
  `db = drizzle(expoDatabase, { schema })`.
- `src/db/queries.ts` — read/write helpers (`getProfile`, `saveProfile`, `listPauseEvents`,
  `createPauseEvent`, and existing smoke-log/supply helpers after relocation).
- `src/db/mappers.ts` — pure entity builders.
- `src/shared/hooks/useDatabaseInitialized.ts` — startup schema/migration and profile detection.
- `drizzle/` — generated/verified migrations applied at startup.

`src/shared/db/` MUST be removed after all imports are migrated; no second Drizzle instance may exist.

## Schema contract

`user_profile`

| DB column | Type | Null | Key |
|-----------|------|------|-----|
| `id` | integer | no | PK, autoincrement |
| `daily_cigarettes` | integer | no | |
| `pack_cost` | real | no | |
| `currency` | text | no | |
| `quit_goal` | text | no | |
| `created_at` | text (ISO-8601) | no | |

`pause_events`

| DB column | Type | Null | Key |
|-----------|------|------|-----|
| `id` | integer | no | PK, autoincrement |
| `timestamp` | text (ISO-8601) | no | indexed |
| `trigger_emotion` | text | no | |
| `resisted` | integer (0/1) | no | |
| `notes` | text | yes | |

## Exposed operations

```ts
export function getProfile(): UserProfile | null;
export function saveProfile(input: NewUserProfile): UserProfile;
export function listPauseEvents(): PauseEvent[];              // DESC by timestamp
export function createPauseEvent(input: NewPauseEvent): PauseEvent;
```

Startup hook:

```ts
export interface DatabaseInitializedState {
  ready: boolean;
  hasProfile: boolean;
  error: Error | null;
  refresh: () => void;
}

export function useDatabaseInitialized(): DatabaseInitializedState;
```

## Requirements

- **R-DB-1**: All domain reads/writes MUST go through Drizzle over `expo-sqlite`; no AsyncStorage and no
  direct table access outside `src/db/`.
- **R-DB-2**: `listPauseEvents` MUST return records DESC by `timestamp` (code-rules §11).
- **R-DB-3**: Writes MUST be atomic per operation; `try` blocks are limited to the storage call
  (code-rules §8).
- **R-DB-4**: Types MUST be explicit; `any`/`unknown` forbidden (code-rules §1).
- **R-DB-5**: Schema setup MUST be idempotent. Migrations in `drizzle/` are canonical; the bootstrap
  `CREATE TABLE IF NOT EXISTS` statements act only as a fallback for databases without journal metadata.
- **R-DB-6**: `ready` MUST remain `false` until schema setup and profile detection complete. `error`
  MUST be populated when setup fails after the fallback attempt.
- **R-DB-7**: `hasProfile` MUST be derived from an actual query against `user_profile` (at least one row),
  never from a flag or cache. `refresh` MUST re-run that query and is used after onboarding and when the
  app returns to the foreground.
- **R-DB-8**: If storage fails, callers MUST surface a user-visible error via `showAppToast` (writes) or
  the layout error state (startup) and MUST NOT persist partial data.
- **R-DB-9**: At most one `user_profile` row may exist; onboarding MUST check existence before inserting.

## PRAGMA / connection settings

- Database file: `pausa.db` in the app's local SQLite directory.
- Connection is opened synchronously once at module load per the feature requirement; all setup and reads
  run after mount inside effects or async submit handlers.

## Privacy

- `pause_events.trigger_emotion` and `notes` are private, local-only, and MUST NOT be sent to any backend.
  Only aggregate metrics may later be synced (constitution §3).
