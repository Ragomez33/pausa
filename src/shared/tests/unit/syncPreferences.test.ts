import { getAuthSnapshot } from '../../services/authService';
import { getSyncState, setSyncState } from '@/db/queries';
import {
  getBackupPreferences,
  isPersonalBackupActive,
  setBackupEnabled,
  setEmotionConsent,
} from '../../services/syncPreferences';

jest.mock('@/db/queries', () => ({
  getSyncState: jest.fn(),
  setSyncState: jest.fn(),
}));

jest.mock('../../services/authService', () => ({
  getAuthSnapshot: jest.fn(),
}));

const mockedGetSyncState = getSyncState as jest.Mock;
const mockedSetSyncState = setSyncState as jest.Mock;
const mockedGetAuth = getAuthSnapshot as jest.Mock;

describe('syncPreferences', () => {
  let state: Record<string, string>;

  beforeEach(() => {
    state = {};
    jest.clearAllMocks();
    mockedGetSyncState.mockImplementation((key: string) => state[key] ?? null);
    mockedSetSyncState.mockImplementation((key: string, value: string) => {
      state[key] = value;
    });
    mockedGetAuth.mockReturnValue({ status: 'authenticated', userId: 'user-1', email: null, error: null });
  });

  it('defaults backup and emotional consent to false', () => {
    expect(getBackupPreferences()).toEqual({
      backupEnabled: false,
      consentEmotions: false,
    });
  });

  it('requires authentication to enable backup', () => {
    mockedGetAuth.mockReturnValue({ status: 'guest', userId: null, email: null, error: null });
    expect(setBackupEnabled(true)).toBe(false);
    expect(getBackupPreferences().backupEnabled).toBe(false);
  });

  it('persists backup and consent independently', () => {
    expect(setBackupEnabled(true)).toBe(true);
    setEmotionConsent(true);

    expect(getBackupPreferences()).toEqual({
      backupEnabled: true,
      consentEmotions: true,
    });
    expect(mockedSetSyncState).toHaveBeenCalledWith('backup_enabled', 'true');
    expect(mockedSetSyncState).toHaveBeenCalledWith('consent_emotions', 'true');
  });

  it('activates personal backup only when authenticated and enabled', () => {
    expect(isPersonalBackupActive()).toBe(false);
    setBackupEnabled(true);
    expect(isPersonalBackupActive()).toBe(true);
  });
});
