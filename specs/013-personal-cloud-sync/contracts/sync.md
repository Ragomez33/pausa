# Contract: Personal Sync Engine, Outbox & Restore

## Local outbox (`global_sync_outbox`)

```ts
export type PersonalSyncEntityType =
  | 'profile'
  | 'smoking_event'
  | 'inventory_log'
  | 'achievement';

export type PersonalSyncStatus = 'pending' | 'sent' | 'failed';

export interface PersonalOutboxRow {
  id: string;
  entityType: PersonalSyncEntityType;
  entityId: string;
  payload: string;
  status: PersonalSyncStatus;
  attempts: number;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
}
```

### Required queries

```ts
enqueuePersonalSyncItem(input): void
listPendingPersonalSyncItems(limit): PersonalOutboxRow[]
markPersonalSyncSent(id): void
markPersonalSyncFailed(id, error): void
countPendingPersonalSyncItems(): number
```

- Unique `(entity_type, entity_id)`: re-enqueueing an entity replaces its payload and resets it to `pending`.
- Enqueue is a local SQLite write only.
- Payload is JSON produced by a pure builder.
- No UI code writes the outbox directly.

## Payload contract (`src/shared/utils/personalSyncPayloads.ts`)

```ts
buildProfileSyncPayload(profile, userId, updatedAt): RemoteProfilePayload
buildPauseSyncPayload(pause, ownerUserId, consentEmotions): RemoteSmokingEventPayload
buildSmokingSyncPayload(smoking, ownerUserId, consentEmotions): RemoteSmokingEventPayload
buildInventorySyncPayload(log, ownerUserId): RemoteInventoryLogPayload
buildAchievementSyncPayload(badge, ownerUserId): RemoteAchievementPayload
```

Rules:

- `ownerUserId` is required; guest rows are never uploaded.
- Pause events map to `event_type = 'paused'`; smoking events map to `event_type = 'smoked'`.
- `trigger_emotion` and `notes` are `null` unless `consentEmotions === true`.
- The remote primary key is always the local `sync_id`.
- Mappers are pure and free of network/database calls.

## Sync engine (`src/shared/services/syncEngine.ts`)

```ts
export interface PersonalSyncSnapshot {
  status: PersonalSyncStatus;
  pendingCount: number;
  configured: boolean;
  authenticated: boolean;
  backupEnabled: boolean;
  lastError: PersonalSyncErrorKind;
}

export function enqueuePersonalSync(entityType, entityId, payload): void;
export function flushPersonalOutbox(): Promise<PersonalSyncSnapshot>;
export function getPersonalSyncSnapshot(): PersonalSyncSnapshot;
export function subscribeToPersonalSync(listener: () => void): () => void;
```

`PersonalSyncStatus`: `disabled | pending | syncing | synced | offline | error`.

Flush algorithm:

1. Return immediately unless configured, authenticated, and `backupEnabled`.
2. Serialize through a module-level promise chain.
3. Load up to 25 `pending`/`failed` rows oldest-first.
4. Upsert each payload into its remote table by `id`.
5. Treat duplicate-key responses as delivered.
6. Mark success `sent`; on failure increment attempts and store the error.
7. Stop the batch on fatal auth/RLS/schema errors; keep remaining rows queued.
8. Notify subscribers and update `last_sync_at` on a fully successful batch.

Triggers: after enqueue, app foreground, auth/consent change, account restore completion, and a 60-second timer while pending.

## Restore (`src/shared/services/personalRestore.ts`)

```ts
export interface RestoreProgress {
  table: 'profile' | 'events' | 'inventory' | 'achievements';
  processed: number;
  done: boolean;
}

export function pullPersonalData(
  userId: string,
  onProgress?: (progress: RestoreProgress) => void,
): Promise<{ restored: number; error: Error | null }>;
```

Rules:

- Fetch pages of 500 ordered by `occurred_at`/`created_at` and `id`.
- Insert local rows with `onConflictDoNothing` by `sync_id`.
- Profile applies only when remote `updated_at` is newer than local.
- Persist checkpoints in `sync_state` after each successful page.
- Never delete or overwrite newer local rows.
- Store remote rows under the authenticated `owner_user_id`.
- Restore runs asynchronously after sign-in; the UI remains readable from existing local data.
- Backfill after restore enqueues only local-only or newer records; a remote profile that won LWW is not re-enqueued.

## Active scope and queries

- `sync_state.active_scope` is `guest` or a Supabase user id.
- Personal reads filter by the active scope:
  - `owner_user_id IS NULL` for guest;
  - `owner_user_id = active user id` for an account.
- Personal writes stamp `owner_user_id` with the active scope.
- Team tables are outside this scope for the MVP.

## Status derivation

| Status | Condition |
|--------|-----------|
| `disabled` | Missing config, unauthenticated, or backup disabled |
| `pending` | Pending rows, no active flush |
| `offline` | Last failure was network-related |
| `syncing` | A flush is running |
| `synced` | No pending rows, last flush succeeded |
| `error` | Auth/RLS/schema fatal error |

## Engine requirements

- **SYNC-1**: Enqueue must never await network or auth.
- **SYNC-2**: Flush batches must be bounded.
- **SYNC-3**: Calls must be serialized to avoid duplicate uploads.
- **SYNC-4**: Failures must never clear or delete local data.
- **SYNC-5**: Guest rows and rows from another account must never be uploaded.
- **SYNC-6**: Emotional fields require explicit consent at payload-build time.
- **SYNC-7**: Restore must be idempotent and resumable.
- **SYNC-8**: Personal sync must not block or alter team sync.
- **SYNC-9**: Before each batch, the engine must resolve the authenticated user and force `user_id` (or profile `id`) to that user; mismatched-owner rows must never be uploaded.
- **SYNC-10**: Failures must expose the PostgREST code, message, table, and entity for diagnosis, both in logs and in the account status panel.
- **SYNC-11**: Retries must use exponential backoff from 60 seconds up to 5 minutes and reset after a successful batch; the account screen must offer a manual retry.
