import type { PersonalSyncErrorKind, PersonalSyncStatus } from '@/shared/constants/sync';

export interface PersonalSyncStatusInput {
  configured: boolean;
  authenticated: boolean;
  backupEnabled: boolean;
  pendingCount: number;
  syncing: boolean;
  lastError: PersonalSyncErrorKind;
}

export function derivePersonalSyncStatus(
  input: PersonalSyncStatusInput,
): PersonalSyncStatus {
  if (!input.configured || !input.authenticated || !input.backupEnabled) {
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
