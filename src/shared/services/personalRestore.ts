import { eq } from 'drizzle-orm';

import { db } from '@/db/client';
import {
  getProfile,
  getRestoreCheckpoint,
  setRestoreCheckpoint,
  setSyncState,
} from '@/db/queries';
import {
  inventoryLogs,
  pauseEvents,
  smokingEvents,
  userBadges,
  userProfile,
} from '@/db/schema';
import { getSupabaseClient, isSupabaseConfigured } from '@/services/supabase';
import { SYNC_STATE_KEYS } from '@/shared/constants/sync';
import { shouldApplyRemoteProfile } from '@/shared/utils/personalRestoreRules';

const PAGE_SIZE = 500;

export interface RestoreProgress {
  table: 'profile' | 'events' | 'inventory' | 'achievements';
  processed: number;
  done: boolean;
}

interface RemoteProfileRow {
  id: string;
  created_at: string;
  updated_at: string;
  settings: {
    dailyCigarettes?: number;
    packCost?: number;
    currency?: string;
    quitGoal?: string;
    postponedCount?: number;
  };
}

interface RemoteEventRow {
  id: string;
  user_id: string;
  event_type: 'paused' | 'smoked';
  trigger_emotion: string | null;
  outcome: 'resisted' | 'ceded' | null;
  notes: string | null;
  duration_seconds: number | null;
  inventory_decremented: boolean | null;
  occurred_at: string;
}

interface RemoteInventoryRow {
  id: string;
  user_id: string;
  movement_type: 'purchase' | 'consumption';
  quantity: number;
  cost: number | null;
  occurred_at: string;
}

interface RemoteAchievementRow {
  id: string;
  user_id: string;
  achievement_code: string;
  unlocked_at: string;
}

function checkpointKey(
  table: RestoreProgress['table'],
  userId: string,
): string {
  const base =
    table === 'events'
      ? SYNC_STATE_KEYS.lastPullEvents
      : table === 'inventory'
        ? SYNC_STATE_KEYS.lastPullInventory
        : SYNC_STATE_KEYS.lastPullAchievements;
  return `${base}:${userId}`;
}

function readOffset(table: RestoreProgress['table'], userId: string): number {
  const value = getRestoreCheckpoint(checkpointKey(table, userId));
  const parsed = value === null ? 0 : Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function report(
  onProgress: ((progress: RestoreProgress) => void) | undefined,
  table: RestoreProgress['table'],
  processed: number,
  done: boolean,
): void {
  if (onProgress !== undefined) {
    onProgress({ table, processed, done });
  }
}

async function restoreProfile(
  userId: string,
  onProgress: ((progress: RestoreProgress) => void) | undefined,
): Promise<number> {
  const client = getSupabaseClient();
  if (client === null) {
    return 0;
  }

  const { data, error } = await client
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .limit(1)
    .returns<RemoteProfileRow[]>();

  if (error !== null || data === null || data[0] === undefined) {
    report(onProgress, 'profile', 0, true);
    return 0;
  }

  const remote = data[0];
  const local = getProfile();
  if (!shouldApplyRemoteProfile(local?.updatedAt ?? null, remote.updated_at)) {
    report(onProgress, 'profile', 1, true);
    return 0;
  }

  const settings = remote.settings ?? {};
  const values = {
    dailyCigarettes: settings.dailyCigarettes ?? local?.dailyCigarettes ?? 0,
    packCost: settings.packCost ?? local?.packCost ?? 0,
    currency: settings.currency ?? local?.currency ?? 'USD',
    quitGoal: settings.quitGoal ?? local?.quitGoal ?? '',
    createdAt: remote.created_at,
    updatedAt: remote.updated_at,
    ownerUserId: userId,
    postponedCount: settings.postponedCount ?? local?.postponedCount ?? 0,
  };

  if (local === null) {
    db.insert(userProfile).values(values).run();
  } else {
    db.update(userProfile).set(values).where(eq(userProfile.id, local.id)).run();
  }

  report(onProgress, 'profile', 1, true);
  return 1;
}

async function restoreEvents(
  userId: string,
  onProgress: ((progress: RestoreProgress) => void) | undefined,
): Promise<number> {
  const client = getSupabaseClient();
  if (client === null) {
    return 0;
  }

  let offset = readOffset('events', userId);
  let restored = 0;

  for (;;) {
    const { data, error } = await client
      .from('smoking_events')
      .select('*')
      .eq('user_id', userId)
      .order('occurred_at', { ascending: true })
      .order('id', { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1)
      .returns<RemoteEventRow[]>();

    if (error !== null || data === null || data.length === 0) {
      break;
    }

    for (const row of data) {
      if (row.event_type === 'paused') {
        db.insert(pauseEvents)
          .values({
            syncId: row.id,
            ownerUserId: userId,
            timestamp: row.occurred_at,
            triggerEmotion: row.trigger_emotion ?? 'habit',
            resisted: row.outcome === 'ceded' ? 0 : 1,
            notes: row.notes,
          })
          .onConflictDoNothing({ target: pauseEvents.syncId })
          .run();
      } else if (row.event_type === 'smoked') {
        db.insert(smokingEvents)
          .values({
            syncId: row.id,
            ownerUserId: userId,
            timestamp: row.occurred_at,
            triggerEmotion: row.trigger_emotion ?? 'habit',
            durationSeconds: row.duration_seconds ?? 0,
            inventoryDecremented: row.inventory_decremented ? 1 : 0,
          })
          .onConflictDoNothing({ target: smokingEvents.syncId })
          .run();
      }
      restored += 1;
    }

    offset += data.length;
    setRestoreCheckpoint(checkpointKey('events', userId), String(offset));
    report(onProgress, 'events', restored, data.length < PAGE_SIZE);
    if (data.length < PAGE_SIZE) {
      break;
    }
  }

  if (restored === 0) {
    report(onProgress, 'events', 0, true);
  }
  return restored;
}

async function restoreInventory(
  userId: string,
  onProgress: ((progress: RestoreProgress) => void) | undefined,
): Promise<number> {
  const client = getSupabaseClient();
  if (client === null) {
    return 0;
  }

  let offset = readOffset('inventory', userId);
  let restored = 0;

  for (;;) {
    const { data, error } = await client
      .from('inventory_logs')
      .select('*')
      .eq('user_id', userId)
      .order('occurred_at', { ascending: true })
      .order('id', { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1)
      .returns<RemoteInventoryRow[]>();

    if (error !== null || data === null || data.length === 0) {
      break;
    }

    for (const row of data) {
      db.insert(inventoryLogs)
        .values({
          syncId: row.id,
          ownerUserId: userId,
          timestamp: row.occurred_at,
          actionType: row.movement_type,
          quantity: row.quantity,
          cost: row.cost,
        })
        .onConflictDoNothing({ target: inventoryLogs.syncId })
        .run();
      restored += 1;
    }

    offset += data.length;
    setRestoreCheckpoint(checkpointKey('inventory', userId), String(offset));
    report(onProgress, 'inventory', restored, data.length < PAGE_SIZE);
    if (data.length < PAGE_SIZE) {
      break;
    }
  }

  if (restored === 0) {
    report(onProgress, 'inventory', 0, true);
  }
  return restored;
}

async function restoreAchievements(
  userId: string,
  onProgress: ((progress: RestoreProgress) => void) | undefined,
): Promise<number> {
  const client = getSupabaseClient();
  if (client === null) {
    return 0;
  }

  let offset = readOffset('achievements', userId);
  let restored = 0;

  for (;;) {
    const { data, error } = await client
      .from('user_achievements')
      .select('*')
      .eq('user_id', userId)
      .order('unlocked_at', { ascending: true })
      .order('id', { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1)
      .returns<RemoteAchievementRow[]>();

    if (error !== null || data === null || data.length === 0) {
      break;
    }

    for (const row of data) {
      db.insert(userBadges)
        .values({
          syncId: row.id,
          ownerUserId: userId,
          badgeKey: row.achievement_code,
          unlockedAt: row.unlocked_at,
        })
        .onConflictDoNothing()
        .run();
      restored += 1;
    }

    offset += data.length;
    setRestoreCheckpoint(checkpointKey('achievements', userId), String(offset));
    report(onProgress, 'achievements', restored, data.length < PAGE_SIZE);
    if (data.length < PAGE_SIZE) {
      break;
    }
  }

  if (restored === 0) {
    report(onProgress, 'achievements', 0, true);
  }
  return restored;
}

export async function pullPersonalData(
  userId: string,
  onProgress?: (progress: RestoreProgress) => void,
): Promise<{ restored: number; error: Error | null }> {
  if (!isSupabaseConfigured()) {
    return { restored: 0, error: null };
  }

  try {
    let restored = await restoreProfile(userId, onProgress);
    restored += await restoreEvents(userId, onProgress);
    restored += await restoreInventory(userId, onProgress);
    restored += await restoreAchievements(userId, onProgress);
    setSyncState(SYNC_STATE_KEYS.lastSyncAt, new Date().toISOString());
    return { restored, error: null };
  } catch (caught) {
    return {
      restored: 0,
      error: caught instanceof Error ? caught : new Error('No se pudo restaurar el respaldo.'),
    };
  }
}
