# Contract: Local Persistence (Module 1)

Single sanctioned persistence interface for domain entities (constitution §3). Local-only; no network.

## Modules

- `src/shared/db/schema.ts` — `userProfile`, `pauseEvents` tables + inferred types.
- `src/shared/db/client.ts` — typed Drizzle instance over expo-sqlite.
- `src/shared/db/queries.ts` — read/write helpers.
- `drizzle/` — generated migrations (applied idempotently at startup via `useDatabaseInitialized`).

## Exposed operations

```ts
// profile
export function getProfile(): UserProfile | null;
export function saveProfile(input: NewUserProfile): UserProfile;

// pause events
export function listPauseEvents(): PauseEvent[];        // DESC by createdAt
export function createPauseEvent(input: NewPauseEvent): PauseEvent;
```

## Requirements

- **R-DB-1**: All reads/writes MUST go through Drizzle; no AsyncStorage for domain entities.
- **R-DB-2**: `listPauseEvents` MUST return records ordered DESC by `createdAt` (code-rules §11).
- **R-DB-3**: Writes MUST be atomic per operation; `try` blocks limited to the DB call (code-rules §8).
- **R-DB-4**: Types MUST be explicit; `any`/`unknown` forbidden (code-rules §1).
- **R-DB-5**: Schema changes MUST ship as generated migrations in `drizzle/`; initialization MUST be
  idempotent.
- **R-DB-6**: If storage fails, callers MUST surface a user-visible error via `showAppToast` and MUST
  NOT persist partial data.

## Privacy

- `pause_events.trigger_emotion` and `notes` are private, local-only, and MUST NOT be sent to any
  backend in this module. Only aggregate metrics may later be synced (constitution §3).
