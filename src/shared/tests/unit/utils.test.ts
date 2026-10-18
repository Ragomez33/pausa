import {
  calculateSupplyDuration,
  formatDate,
  formatTimeRemaining,
} from '../../utils/utils';

describe('formatTimeRemaining', () => {
  it('formats seconds as m:ss with zero padding', () => {
    expect(formatTimeRemaining(5)).toBe('0:05');
    expect(formatTimeRemaining(65)).toBe('1:05');
    expect(formatTimeRemaining(600)).toBe('10:00');
  });

  it('clamps negative values to zero', () => {
    expect(formatTimeRemaining(-10)).toBe('0:00');
  });
});

describe('formatDate', () => {
  it('returns a non-empty localized date string', () => {
    expect(typeof formatDate(0)).toBe('string');
    expect(formatDate(0).length).toBeGreaterThan(0);
  });
});

describe('calculateSupplyDuration', () => {
  it('computes days of supply from remaining cigarettes and daily target', () => {
    expect(calculateSupplyDuration(40, 10)).toBe(4);
  });

  it('returns null when the daily target is not positive', () => {
    expect(calculateSupplyDuration(40, 0)).toBeNull();
  });
});
