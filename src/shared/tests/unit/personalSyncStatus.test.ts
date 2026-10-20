import { derivePersonalSyncStatus } from '../../utils/personalSyncStatus';

describe('derivePersonalSyncStatus', () => {
  const base = {
    configured: true,
    authenticated: true,
    backupEnabled: true,
    pendingCount: 0,
    syncing: false,
    lastError: null as 'network' | 'fatal' | null,
  };

  it('is disabled when configuration, auth, or backup is missing', () => {
    expect(derivePersonalSyncStatus({ ...base, configured: false })).toBe('disabled');
    expect(derivePersonalSyncStatus({ ...base, authenticated: false })).toBe('disabled');
    expect(derivePersonalSyncStatus({ ...base, backupEnabled: false })).toBe('disabled');
  });

  it('reports fatal errors before pending work', () => {
    expect(
      derivePersonalSyncStatus({ ...base, pendingCount: 3, lastError: 'fatal' }),
    ).toBe('error');
  });

  it('reports syncing and pending states', () => {
    expect(derivePersonalSyncStatus({ ...base, syncing: true })).toBe('syncing');
    expect(derivePersonalSyncStatus({ ...base, pendingCount: 2 })).toBe('pending');
    expect(
      derivePersonalSyncStatus({ ...base, pendingCount: 2, lastError: 'network' }),
    ).toBe('offline');
  });

  it('reports synced with an empty queue', () => {
    expect(derivePersonalSyncStatus(base)).toBe('synced');
  });
});
