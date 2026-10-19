import {
  MAX_REMINDER_INTERVAL_MINUTES,
  MIN_REMINDER_INTERVAL_MINUTES,
  calculateIdleIntervalMinutes,
  computeIdleSchedule,
} from '../../utils/reminderSchedule';

describe('calculateIdleIntervalMinutes', () => {
  it('uses a 20/day profile as roughly 48 minutes', () => {
    expect(calculateIdleIntervalMinutes(20)).toBe(48);
  });

  it('clamps to the minimum interval', () => {
    expect(calculateIdleIntervalMinutes(40)).toBe(MIN_REMINDER_INTERVAL_MINUTES);
    expect(calculateIdleIntervalMinutes(100)).toBe(MIN_REMINDER_INTERVAL_MINUTES);
  });

  it('clamps to the maximum interval', () => {
    expect(calculateIdleIntervalMinutes(1)).toBe(MAX_REMINDER_INTERVAL_MINUTES);
  });

  it('uses the maximum for zero, negative, or invalid values', () => {
    expect(calculateIdleIntervalMinutes(0)).toBe(MAX_REMINDER_INTERVAL_MINUTES);
    expect(calculateIdleIntervalMinutes(-1)).toBe(MAX_REMINDER_INTERVAL_MINUTES);
    expect(calculateIdleIntervalMinutes(Number.NaN)).toBe(MAX_REMINDER_INTERVAL_MINUTES);
  });
});

describe('computeIdleSchedule', () => {
  it('returns the interval and scheduled timestamp', () => {
    const now = 1_000_000;
    const schedule = computeIdleSchedule(now, 20);

    expect(schedule.intervalMinutes).toBe(48);
    expect(schedule.scheduledAtMs).toBe(now + 48 * 60_000);
  });

  it('falls back safely for an invalid now value', () => {
    const schedule = computeIdleSchedule(Number.NaN, 20);

    expect(schedule.intervalMinutes).toBe(48);
    expect(Number.isFinite(schedule.scheduledAtMs)).toBe(true);
  });
});
