import {
  countPendingPersonalSyncItems,
  enqueuePersonalSyncItem,
  getScopedOwnerUserId,
  listPendingPersonalSyncItems,
  markPersonalSyncFailed,
  markPersonalSyncSent,
} from '@/db/queries';
import { getSupabaseClient, isSupabaseConfigured } from '@/services/supabase';
import { getAuthSnapshot } from '../../services/authService';
import { getBackupPreferences, isPersonalBackupActive } from '../../services/syncPreferences';
import {
  enqueuePersonalSync,
  flushPersonalOutbox,
  getPersonalSyncSnapshot,
} from '../../services/syncEngine';
import type { RemoteSmokingEventPayload } from '../../utils/personalSyncPayloads';

jest.mock('@/db/queries', () => ({
  countPendingPersonalSyncItems: jest.fn(),
  enqueuePersonalSyncItem: jest.fn(),
  getScopedOwnerUserId: jest.fn(),
  listPendingPersonalSyncItems: jest.fn(),
  markPersonalSyncFailed: jest.fn(),
  markPersonalSyncSent: jest.fn(),
  pruneSentPersonalSyncItems: jest.fn(),
  setSyncState: jest.fn(),
}));

jest.mock('@/services/supabase', () => ({
  isSupabaseConfigured: jest.fn(),
  getSupabaseClient: jest.fn(),
}));

jest.mock('../../services/authService', () => ({
  getAuthSnapshot: jest.fn(),
}));

jest.mock('../../services/syncPreferences', () => ({
  getBackupPreferences: jest.fn(),
  isPersonalBackupActive: jest.fn(),
}));

const mockedConfigured = isSupabaseConfigured as jest.Mock;
const mockedClient = getSupabaseClient as jest.Mock;
const mockedAuth = getAuthSnapshot as jest.Mock;
const mockedActive = isPersonalBackupActive as jest.Mock;
const mockedOwner = getScopedOwnerUserId as jest.Mock;
const mockedEnqueue = enqueuePersonalSyncItem as jest.Mock;
const mockedList = listPendingPersonalSyncItems as jest.Mock;
const mockedSent = markPersonalSyncSent as jest.Mock;
const mockedFailed = markPersonalSyncFailed as jest.Mock;
const mockedPendingCount = countPendingPersonalSyncItems as jest.Mock;
const mockedPrefs = getBackupPreferences as jest.Mock;

const upsert = jest.fn();
const from = jest.fn(() => ({ upsert }));

const payload: RemoteSmokingEventPayload = {
  id: 'event-1',
  user_id: 'user-1',
  event_type: 'paused',
  trigger_emotion: null,
  outcome: 'resisted',
  notes: null,
  duration_seconds: null,
  inventory_decremented: null,
  occurred_at: '2026-10-01T00:00:00.000Z',
  created_at: '2026-10-01T00:00:00.000Z',
};

describe('personal sync engine', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedConfigured.mockReturnValue(true);
    mockedClient.mockReturnValue({ from });
    mockedAuth.mockReturnValue({ status: 'authenticated', userId: 'user-1', email: null, error: null });
    mockedActive.mockReturnValue(true);
    mockedOwner.mockReturnValue('user-1');
    mockedPrefs.mockReturnValue({ backupEnabled: true, consentEmotions: false });
    mockedPendingCount.mockReturnValue(0);
    upsert.mockResolvedValue({ error: null });
  });

  it('enqueues only for an authenticated, backup-enabled owner', () => {
    enqueuePersonalSync('smoking_event', 'event-1', payload);

    expect(mockedEnqueue).toHaveBeenCalledWith(
      expect.objectContaining({
        entityType: 'smoking_event',
        entityId: 'event-1',
      }),
    );
  });

  it('does not enqueue for the guest scope', () => {
    mockedOwner.mockReturnValue(null);
    enqueuePersonalSync('smoking_event', 'event-1', payload);
    expect(mockedEnqueue).not.toHaveBeenCalled();
  });

  it('upserts pending payloads and marks them sent', async () => {
    mockedList.mockReturnValue([
      {
        id: 'outbox-1',
        entityType: 'smoking_event',
        entityId: 'event-1',
        payload: JSON.stringify(payload),
        status: 'pending',
        attempts: 0,
        lastError: null,
        createdAt: '2026-10-01T00:00:00.000Z',
        updatedAt: '2026-10-01T00:00:00.000Z',
      },
    ]);

    const snapshot = await flushPersonalOutbox();

    expect(upsert).toHaveBeenCalledWith(payload, { onConflict: 'id' });
    expect(mockedSent).toHaveBeenCalledWith('outbox-1');
    expect(snapshot.status).toBe('synced');
  });

  it('never uploads rows owned by another account', async () => {
    mockedList.mockReturnValue([
      {
        id: 'outbox-2',
        entityType: 'smoking_event',
        entityId: 'event-2',
        payload: JSON.stringify({ ...payload, user_id: 'user-2' }),
        status: 'pending',
        attempts: 0,
        lastError: null,
        createdAt: '2026-10-01T00:00:00.000Z',
        updatedAt: '2026-10-01T00:00:00.000Z',
      },
    ]);

    await flushPersonalOutbox();

    expect(upsert).not.toHaveBeenCalled();
    expect(mockedSent).not.toHaveBeenCalledWith('outbox-2');
  });

  it('keeps failed rows and reports an offline status', async () => {
    mockedList.mockReturnValue([
      {
        id: 'outbox-3',
        entityType: 'smoking_event',
        entityId: 'event-3',
        payload: JSON.stringify(payload),
        status: 'pending',
        attempts: 0,
        lastError: null,
        createdAt: '2026-10-01T00:00:00.000Z',
        updatedAt: '2026-10-01T00:00:00.000Z',
      },
    ]);
    upsert.mockResolvedValueOnce({ error: { code: 'NETWORK', message: 'network down' } });
    mockedPendingCount.mockReturnValue(1);

    const snapshot = await flushPersonalOutbox();

    expect(mockedFailed).toHaveBeenCalledWith('outbox-3', 'network down');
    expect(snapshot.status).toBe('offline');
  });

  it('reports fatal errors as an error status', async () => {
    mockedList.mockReturnValue([
      {
        id: 'outbox-4',
        entityType: 'smoking_event',
        entityId: 'event-4',
        payload: JSON.stringify(payload),
        status: 'pending',
        attempts: 0,
        lastError: null,
        createdAt: '2026-10-01T00:00:00.000Z',
        updatedAt: '2026-10-01T00:00:00.000Z',
      },
    ]);
    upsert.mockResolvedValueOnce({ error: { code: '42501', message: 'row-level security policy' } });
    mockedPendingCount.mockReturnValue(1);

    const snapshot = await flushPersonalOutbox();

    expect(snapshot.status).toBe('error');
  });

  it('reports disabled when backup is inactive', () => {
    mockedActive.mockReturnValue(false);
    expect(getPersonalSyncSnapshot().status).toBe('disabled');
  });
});
