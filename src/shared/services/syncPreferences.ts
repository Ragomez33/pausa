import { getSyncState, setSyncState } from '@/db/queries';
import { SYNC_STATE_KEYS } from '@/shared/constants/sync';

import { getAuthSnapshot } from './authService';

export interface BackupPreferences {
  backupEnabled: boolean;
  consentEmotions: boolean;
}

function readBoolean(key: string): boolean {
  return getSyncState(key) === 'true';
}

export function getBackupPreferences(): BackupPreferences {
  const auth = getAuthSnapshot();
  const owner =
    auth.status === 'authenticated' ? getSyncState(SYNC_STATE_KEYS.backupOwner) : null;
  const belongsToActiveAccount =
    auth.userId !== null && owner === auth.userId;
  return {
    backupEnabled:
      belongsToActiveAccount && readBoolean(SYNC_STATE_KEYS.backupEnabled),
    consentEmotions:
      belongsToActiveAccount && readBoolean(SYNC_STATE_KEYS.consentEmotions),
  };
}

export function setBackupEnabled(enabled: boolean): boolean {
  const auth = getAuthSnapshot();
  if (enabled && auth.status !== 'authenticated') {
    return false;
  }
  setSyncState(SYNC_STATE_KEYS.backupEnabled, enabled ? 'true' : 'false');
  setSyncState(
    SYNC_STATE_KEYS.backupOwner,
    enabled && auth.userId !== null ? auth.userId : '',
  );
  if (!enabled) {
    setSyncState(SYNC_STATE_KEYS.consentEmotions, 'false');
  }
  return true;
}

export function setEmotionConsent(enabled: boolean): void {
  if (!getBackupPreferences().backupEnabled) {
    return;
  }
  setSyncState(SYNC_STATE_KEYS.consentEmotions, enabled ? 'true' : 'false');
}

export function isPersonalBackupActive(): boolean {
  return (
    getAuthSnapshot().status === 'authenticated' &&
    getBackupPreferences().backupEnabled
  );
}
