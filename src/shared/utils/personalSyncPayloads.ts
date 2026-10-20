import type { InventoryLog, PauseEvent, SmokingEvent, UserBadge, UserProfile } from '@/db/schema';
import { CIGARETTES_PER_PACK } from '@/shared/constants/app';

export interface RemoteProfilePayload {
  id: string;
  created_at: string;
  updated_at: string;
  settings: {
    dailyCigarettes: number;
    packCost: number;
    currency: string;
    quitGoal: string;
    postponedCount: number;
  };
}

export interface RemoteSmokingEventPayload {
  id: string;
  user_id: string;
  event_type: 'paused' | 'smoked';
  trigger_emotion: string | null;
  outcome: 'resisted' | 'ceded' | null;
  notes: string | null;
  duration_seconds: number | null;
  inventory_decremented: boolean | null;
  occurred_at: string;
  created_at: string;
}

export interface RemoteInventoryLogPayload {
  id: string;
  user_id: string;
  movement_type: 'purchase' | 'consumption';
  quantity: number;
  packs_bought: number | null;
  cost: number | null;
  occurred_at: string;
  created_at: string;
}

export interface RemoteAchievementPayload {
  id: string;
  user_id: string;
  achievement_code: string;
  unlocked_at: string;
  created_at: string;
}

export type PersonalSyncPayload =
  | RemoteProfilePayload
  | RemoteSmokingEventPayload
  | RemoteInventoryLogPayload
  | RemoteAchievementPayload;

function nowIso(): string {
  return new Date().toISOString();
}

export function buildProfileSyncPayload(
  profile: UserProfile,
  userId: string,
): RemoteProfilePayload {
  return {
    id: userId,
    created_at: profile.createdAt,
    updated_at: profile.updatedAt,
    settings: {
      dailyCigarettes: profile.dailyCigarettes,
      packCost: profile.packCost,
      currency: profile.currency,
      quitGoal: profile.quitGoal,
      postponedCount: profile.postponedCount,
    },
  };
}

export function buildPauseSyncPayload(
  pause: PauseEvent,
  ownerUserId: string,
  consentEmotions: boolean,
): RemoteSmokingEventPayload {
  return {
    id: pause.syncId,
    user_id: ownerUserId,
    event_type: 'paused',
    trigger_emotion: consentEmotions ? pause.triggerEmotion : null,
    outcome: pause.resisted === 1 ? 'resisted' : 'ceded',
    notes: consentEmotions ? pause.notes : null,
    duration_seconds: null,
    inventory_decremented: null,
    occurred_at: pause.timestamp,
    created_at: nowIso(),
  };
}

export function buildSmokingSyncPayload(
  smoking: SmokingEvent,
  ownerUserId: string,
  consentEmotions: boolean,
): RemoteSmokingEventPayload {
  return {
    id: smoking.syncId,
    user_id: ownerUserId,
    event_type: 'smoked',
    trigger_emotion: consentEmotions ? smoking.triggerEmotion : null,
    outcome: null,
    notes: null,
    duration_seconds: smoking.durationSeconds,
    inventory_decremented: smoking.inventoryDecremented === 1,
    occurred_at: smoking.timestamp,
    created_at: nowIso(),
  };
}

export function buildInventorySyncPayload(
  log: InventoryLog,
  ownerUserId: string,
): RemoteInventoryLogPayload {
  return {
    id: log.syncId,
    user_id: ownerUserId,
    movement_type: log.actionType === 'purchase' ? 'purchase' : 'consumption',
    quantity: log.quantity,
    packs_bought:
      log.actionType === 'purchase'
        ? Math.max(1, Math.round(log.quantity / CIGARETTES_PER_PACK))
        : null,
    cost: log.cost,
    occurred_at: log.timestamp,
    created_at: nowIso(),
  };
}

export function buildAchievementSyncPayload(
  badge: UserBadge,
  ownerUserId: string,
): RemoteAchievementPayload {
  return {
    id: badge.syncId,
    user_id: ownerUserId,
    achievement_code: badge.badgeKey,
    unlocked_at: badge.unlockedAt,
    created_at: nowIso(),
  };
}
