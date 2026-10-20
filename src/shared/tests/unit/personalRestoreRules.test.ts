import { shouldApplyRemoteProfile } from '../../utils/personalRestoreRules';

describe('shouldApplyRemoteProfile', () => {
  it('applies a remote profile when no local profile exists', () => {
    expect(shouldApplyRemoteProfile(null, '2026-10-01T00:00:00.000Z')).toBe(true);
  });

  it('applies only a strictly newer remote profile', () => {
    expect(
      shouldApplyRemoteProfile(
        '2026-10-01T00:00:00.000Z',
        '2026-10-02T00:00:00.000Z',
      ),
    ).toBe(true);
    expect(
      shouldApplyRemoteProfile(
        '2026-10-02T00:00:00.000Z',
        '2026-10-02T00:00:00.000Z',
      ),
    ).toBe(false);
    expect(
      shouldApplyRemoteProfile(
        '2026-10-03T00:00:00.000Z',
        '2026-10-02T00:00:00.000Z',
      ),
    ).toBe(false);
  });

  it('handles invalid timestamps safely', () => {
    expect(shouldApplyRemoteProfile('bad', 'also-bad')).toBe(false);
    expect(shouldApplyRemoteProfile('bad', '2026-10-01T00:00:00.000Z')).toBe(true);
  });
});
