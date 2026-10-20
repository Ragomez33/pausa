import { isNull, count } from 'drizzle-orm';

import { db } from '@/db/client';
import {
  getProfile,
  listInventoryLogs,
  listPauseEvents,
  listSmokingEvents,
  listUserBadges,
} from '@/db/queries';
import {
  inventoryLogs,
  pauseEvents,
  smokingEvents,
  userBadges,
  userProfile,
} from '@/db/schema';
import { enqueuePersonalSync } from '@/shared/services/syncEngine';
import { getBackupPreferences } from '@/shared/services/syncPreferences';
import {
  buildAchievementSyncPayload,
  buildInventorySyncPayload,
  buildPauseSyncPayload,
  buildProfileSyncPayload,
  buildSmokingSyncPayload,
} from '@/shared/utils/personalSyncPayloads';

export function hasGuestPersonalData(): boolean {
  const rows = db
    .select({ count: count() })
    .from(userProfile)
    .where(isNull(userProfile.ownerUserId))
    .all();
  return Number(rows[0]?.count ?? 0) > 0;
}

export function adoptGuestData(userId: string): void {
  const now = new Date().toISOString();
  db.transaction((transaction) => {
    transaction
      .update(userProfile)
      .set({ ownerUserId: userId, updatedAt: now })
      .where(isNull(userProfile.ownerUserId))
      .run();
    transaction
      .update(pauseEvents)
      .set({ ownerUserId: userId })
      .where(isNull(pauseEvents.ownerUserId))
      .run();
    transaction
      .update(smokingEvents)
      .set({ ownerUserId: userId })
      .where(isNull(smokingEvents.ownerUserId))
      .run();
    transaction
      .update(inventoryLogs)
      .set({ ownerUserId: userId })
      .where(isNull(inventoryLogs.ownerUserId))
      .run();
    transaction
      .update(userBadges)
      .set({ ownerUserId: userId })
      .where(isNull(userBadges.ownerUserId))
      .run();
  });
}

export function enqueueUnsyncedPersonalData(userId: string): void {
  const preferences = getBackupPreferences();
  if (!preferences.backupEnabled) {
    return;
  }

  const profile = getProfile();
  if (profile !== null && profile.ownerUserId === userId) {
    enqueuePersonalSync(
      'profile',
      userId,
      buildProfileSyncPayload(profile, userId),
    );
  }

  for (const pause of listPauseEvents()) {
    if (pause.ownerUserId !== userId) {
      continue;
    }
    enqueuePersonalSync(
      'smoking_event',
      pause.syncId,
      buildPauseSyncPayload(pause, userId, preferences.consentEmotions),
    );
  }

  for (const smoking of listSmokingEvents()) {
    if (smoking.ownerUserId !== userId) {
      continue;
    }
    enqueuePersonalSync(
      'smoking_event',
      smoking.syncId,
      buildSmokingSyncPayload(smoking, userId, preferences.consentEmotions),
    );
  }

  for (const log of listInventoryLogs()) {
    if (log.ownerUserId !== userId) {
      continue;
    }
    enqueuePersonalSync(
      'inventory_log',
      log.syncId,
      buildInventorySyncPayload(log, userId),
    );
  }

  for (const badge of listUserBadges()) {
    if (badge.ownerUserId !== userId) {
      continue;
    }
    enqueuePersonalSync(
      'achievement',
      badge.syncId,
      buildAchievementSyncPayload(badge, userId),
    );
  }
}
