# Contract: Local-First Sync & Realtime

## Outbox

`src/db/schema.ts` + migration `0007_team_sync_outbox.sql` define `team_event_outbox` as in `data-model.md`.

Queries:

```ts
export function enqueueTeamEvent(input: {
  teamId: string;
  userName: string;
  eventType: 'posponed' | 'smoked';
  timestamp: string;
  id?: string;
}): void;

export function listPendingTeamEvents(limit?: number): TeamEventOutbox[];
export function markTeamEventSent(id: string): void;
export function markTeamEventFailed(id: string, error: string): void;
export function countPendingTeamEvents(): number;
```

## Sync engine

`src/modules/team/sync/teamSync.ts`

```ts
export function enqueueTeamSharedEvent(eventType: 'posponed' | 'smoked'): void;
export function flushTeamOutbox(): Promise<TeamFlushResult>;
export function getTeamSyncStatusSnapshot(): TeamSyncStatusSnapshot;
export function subscribeToTeamSync(listener: () => void): () => void;
```

Requirements:

- `enqueueTeamSharedEvent` no-ops without an active team or config; never throws.
- Outbox rows never contain trigger emotions.
- Flush is serialized, idempotent (remote upsert by event id), FIFO, and marks successes/failures.
- Flush triggers: after enqueue, app foreground, dashboard focus, and a 60-second timer while pending events exist.
- Fatal auth/RLS/config errors stop the flush and surface `error`; retryable network errors surface `offline`.
- No individual local feature awaits a network result.

## Realtime

`src/modules/team/sync/useTeamRealtime.ts`

```ts
export function useTeamRealtime(teamId: string | null): {
  events: SharedEvent[];
  status: 'disabled' | 'connecting' | 'connected' | 'error';
};
```

- Channel name: `team:<teamId>`.
- Listener: `postgres_changes` INSERT filtered by `team_id=eq.<teamId>`.
- Deduplicate events by id.
- Remove the channel on unmount or team change.
- No channel when config is missing.

## Merge

`src/modules/team/sync/mergeRemoteEvents.ts`

```ts
export function mergeRemoteMembers(
  members: TeamMember[],
  remoteEvents: SharedEvent[],
  localUserName: string,
  nowMs: number,
): TeamMember[];
```

- Local user keeps local snapshot values.
- Other members derive postponed/smoked/streak/stumble from remote events.
- Duplicate event ids are counted once.
- Unknown users are ignored.
- Merged members feed the existing summary/leaderboard functions.

## Dashboard

- `useTeamDashboard` includes outbox status, realtime events, and merged members.
- `TeamScreen` shows a non-blocking sync status banner (disabled/pending/offline/syncing/synced/error).
- Realtime arrivals refresh summary and leaderboard without navigation.
- Existing empty/loading/error states remain.

## Requirements

- **R-SYNC-1**: Individual features never depend on network/config.
- **R-SYNC-2**: Exactly one outbox row per local team action.
- **R-SYNC-3**: No trigger emotion/notes in outbox or remote payloads.
- **R-SYNC-4**: Outbox persists across restarts and retries.
- **R-SYNC-5**: Flush is serialized and idempotent.
- **R-SYNC-6**: Realtime cleanup on team change/unmount.
- **R-SYNC-7**: Local echoes are deduplicated.
- **R-SYNC-8**: Failures are non-blocking and preserve local/queued data.
