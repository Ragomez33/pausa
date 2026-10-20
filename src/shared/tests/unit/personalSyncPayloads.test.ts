import type {
  InventoryLog,
  PauseEvent,
  SmokingEvent,
  UserBadge,
  UserProfile,
} from '@/db/schema';

import {
  buildAchievementSyncPayload,
  buildInventorySyncPayload,
  buildPauseSyncPayload,
  buildProfileSyncPayload,
  buildSmokingSyncPayload,
} from '../../utils/personalSyncPayloads';

const profile: UserProfile = {
  id: 1,
  dailyCigarettes: 10,
  packCost: 5,
  currency: 'USD',
  quitGoal: 'Salud',
  createdAt: '2026-10-01T00:00:00.000Z',
  updatedAt: '2026-10-02T00:00:00.000Z',
  ownerUserId: 'user-1',
  postponedCount: 3,
};

const pause: PauseEvent = {
  id: 1,
  syncId: 'pause-uuid',
  ownerUserId: 'user-1',
  timestamp: '2026-10-02T10:00:00.000Z',
  triggerEmotion: 'anxiety_stress',
  resisted: 1,
  notes: 'nota privada',
};

const smoking: SmokingEvent = {
  id: 1,
  syncId: 'smoke-uuid',
  ownerUserId: 'user-1',
  timestamp: '2026-10-02T11:00:00.000Z',
  triggerEmotion: 'habit',
  durationSeconds: 300,
  inventoryDecremented: 1,
};

const inventory: InventoryLog = {
  id: 1,
  syncId: 'inventory-uuid',
  ownerUserId: 'user-1',
  timestamp: '2026-10-02T12:00:00.000Z',
  actionType: 'purchase',
  quantity: 40,
  cost: 5,
};

const badge: UserBadge = {
  id: 1,
  syncId: 'badge-uuid',
  ownerUserId: 'user-1',
  badgeKey: 'first-pause',
  unlockedAt: '2026-10-02T13:00:00.000Z',
};

describe('personalSyncPayloads', () => {
  it('maps the profile settings with its LWW timestamp', () => {
    expect(buildProfileSyncPayload(profile, 'user-1')).toMatchObject({
      id: 'user-1',
      updated_at: profile.updatedAt,
      settings: {
        dailyCigarettes: 10,
        postponedCount: 3,
      },
    });
  });

  it('maps pauses to paused events', () => {
    expect(buildPauseSyncPayload(pause, 'user-1', false)).toMatchObject({
      id: 'pause-uuid',
      event_type: 'paused',
      outcome: 'resisted',
      trigger_emotion: null,
      notes: null,
    });
  });

  it('includes emotional fields only with consent', () => {
    expect(buildPauseSyncPayload(pause, 'user-1', true)).toMatchObject({
      trigger_emotion: 'anxiety_stress',
      notes: 'nota privada',
    });
  });

  it('maps smoking sessions and inventory flags', () => {
    expect(buildSmokingSyncPayload(smoking, 'user-1', false)).toMatchObject({
      id: 'smoke-uuid',
      event_type: 'smoked',
      duration_seconds: 300,
      inventory_decremented: true,
    });
  });

  it('maps purchases with packs and consumption without packs', () => {
    expect(buildInventorySyncPayload(inventory, 'user-1')).toMatchObject({
      movement_type: 'purchase',
      quantity: 40,
      packs_bought: 2,
    });
    expect(
      buildInventorySyncPayload({ ...inventory, actionType: 'consumption' }, 'user-1'),
    ).toMatchObject({
      movement_type: 'consumption',
      packs_bought: null,
    });
  });

  it('maps achievements with the stable code', () => {
    expect(buildAchievementSyncPayload(badge, 'user-1')).toMatchObject({
      id: 'badge-uuid',
      achievement_code: 'first-pause',
    });
  });
});
