import { BADGE_CATALOG } from '../../utils/catalog';
import { formatUnlockMessage } from '../../utils/feedback';

describe('formatUnlockMessage', () => {
  it('returns null when no badge unlocks', () => {
    expect(formatUnlockMessage([])).toBeNull();
  });

  it('names a single unlocked badge', () => {
    expect(formatUnlockMessage([BADGE_CATALOG[0]])).toBe('Primer paso');
  });

  it('lists multiple unlocked badges', () => {
    expect(formatUnlockMessage([BADGE_CATALOG[0], BADGE_CATALOG[2]])).toBe(
      'Primer paso, Un día limpio',
    );
  });
});
