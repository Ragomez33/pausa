export const GUEST_SCOPE = 'guest';

export const PERSONAL_SYNC_BATCH_SIZE = 25;
export const PERSONAL_SYNC_RETRY_MS = 60_000;
export const PERSONAL_SYNC_SENT_RETENTION_DAYS = 7;

export type PersonalSyncEntityType =
  | 'profile'
  | 'smoking_event'
  | 'inventory_log'
  | 'achievement';

export type PersonalSyncStatus =
  | 'disabled'
  | 'pending'
  | 'syncing'
  | 'synced'
  | 'offline'
  | 'error';

export type PersonalSyncErrorKind = 'network' | 'fatal' | null;

export const SYNC_STATE_KEYS = {
  activeScope: 'active_scope',
  backupEnabled: 'backup_enabled',
  backupOwner: 'backup_owner',
  consentEmotions: 'consent_emotions',
  lastSyncAt: 'last_sync_at',
  lastPullEvents: 'last_pull_events',
  lastPullInventory: 'last_pull_inventory',
  lastPullAchievements: 'last_pull_achievements',
} as const;
