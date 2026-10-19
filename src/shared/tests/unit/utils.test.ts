import {
  calculateSupplyDuration,
  formatDate,
  formatDateTime,
  formatElapsedDuration,
  formatMoney,
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

describe('formatDateTime', () => {
  it('formats a valid ISO timestamp as a non-empty localized string', () => {
    const result = formatDateTime('2026-10-19T10:30:00.000Z');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('returns the raw value for invalid timestamps', () => {
    expect(formatDateTime('not-a-date')).toBe('not-a-date');
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

describe('formatMoney', () => {
  it('formats a valid currency', () => {
    expect(formatMoney(5, 'USD')).toContain('5');
  });

  it('falls back to a readable string for invalid currency codes', () => {
    expect(formatMoney(5, 'INVALID')).toContain('INVALID');
  });
});

describe('formatElapsedDuration', () => {
  it('returns 0m for zero, negative, or invalid values', () => {
    expect(formatElapsedDuration(0)).toBe('0m');
    expect(formatElapsedDuration(-5_000)).toBe('0m');
    expect(formatElapsedDuration(Number.NaN)).toBe('0m');
    expect(formatElapsedDuration(Number.POSITIVE_INFINITY)).toBe('0m');
  });

  it('formats minutes, hours, and days', () => {
    expect(formatElapsedDuration(5 * 60_000)).toBe('5m');
    expect(formatElapsedDuration((2 * 60 + 5) * 60_000)).toBe('2h 5m');
    expect(formatElapsedDuration(((3 * 24 + 4) * 60 + 12) * 60_000)).toBe('3d 4h 12m');
  });
});
