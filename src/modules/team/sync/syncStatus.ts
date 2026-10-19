export type TeamSyncErrorKind = 'network' | 'fatal' | null;

export type TeamSyncStatus =
  | 'disabled'
  | 'pending'
  | 'offline'
  | 'syncing'
  | 'synced'
  | 'error';

export interface TeamSyncStatusInput {
  configured: boolean;
  pendingCount: number;
  syncing: boolean;
  lastError: TeamSyncErrorKind;
}

export function deriveTeamSyncStatus(input: TeamSyncStatusInput): TeamSyncStatus {
  if (!input.configured) {
    return 'disabled';
  }
  if (input.lastError === 'fatal') {
    return 'error';
  }
  if (input.syncing) {
    return 'syncing';
  }
  if (input.pendingCount > 0) {
    return input.lastError === 'network' ? 'offline' : 'pending';
  }
  return 'synced';
}
