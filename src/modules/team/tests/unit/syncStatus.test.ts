import { deriveTeamSyncStatus } from '../../sync/syncStatus';

describe('deriveTeamSyncStatus', () => {
  it('is disabled without configuration', () => {
    expect(
      deriveTeamSyncStatus({
        configured: false,
        pendingCount: 3,
        syncing: true,
        lastError: 'fatal',
      }),
    ).toBe('disabled');
  });

  it('reports fatal errors', () => {
    expect(
      deriveTeamSyncStatus({
        configured: true,
        pendingCount: 2,
        syncing: false,
        lastError: 'fatal',
      }),
    ).toBe('error');
  });

  it('reports syncing', () => {
    expect(
      deriveTeamSyncStatus({
        configured: true,
        pendingCount: 2,
        syncing: true,
        lastError: null,
      }),
    ).toBe('syncing');
  });

  it('reports offline vs pending based on the last error', () => {
    expect(
      deriveTeamSyncStatus({
        configured: true,
        pendingCount: 2,
        syncing: false,
        lastError: 'network',
      }),
    ).toBe('offline');
    expect(
      deriveTeamSyncStatus({
        configured: true,
        pendingCount: 2,
        syncing: false,
        lastError: null,
      }),
    ).toBe('pending');
  });

  it('is synced when nothing is pending', () => {
    expect(
      deriveTeamSyncStatus({
        configured: true,
        pendingCount: 0,
        syncing: false,
        lastError: null,
      }),
    ).toBe('synced');
  });
});
