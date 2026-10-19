import {
  MIN_REMINDER_INTERVAL_MINUTES,
  buildReminderDates,
  calculateReminderIntervalMinutes,
} from '../../utils/reminderSchedule';

describe('calculateReminderIntervalMinutes', () => {
  it('uses waking hours divided by daily cigarettes', () => {
    expect(calculateReminderIntervalMinutes(16, 16)).toBe(60);
    expect(calculateReminderIntervalMinutes(8, 16)).toBe(120);
  });

  it('clamps to the minimum interval', () => {
    expect(calculateReminderIntervalMinutes(100, 16)).toBe(MIN_REMINDER_INTERVAL_MINUTES);
  });

  it('returns the minimum for zero or invalid daily consumption', () => {
    expect(calculateReminderIntervalMinutes(0)).toBe(MIN_REMINDER_INTERVAL_MINUTES);
    expect(calculateReminderIntervalMinutes(Number.NaN)).toBe(MIN_REMINDER_INTERVAL_MINUTES);
  });
});

describe('buildReminderDates', () => {
  it('schedules within waking hours for the next 24 hours', () => {
    const now = new Date(2026, 9, 19, 7, 0, 0, 0).getTime();
    const dates = buildReminderDates(now, 60);

    expect(dates.length).toBeGreaterThan(0);
    for (const date of dates) {
      const value = new Date(date);
      expect(value.getHours()).toBeGreaterThanOrEqual(8);
      expect(value.getHours()).toBeLessThanOrEqual(22);
      expect(date).toBeGreaterThan(now);
      expect(date).toBeLessThanOrEqual(now + 86_400_000);
    }
  });

  it('returns no dates for invalid input', () => {
    expect(buildReminderDates(Number.NaN, 60)).toEqual([]);
    expect(buildReminderDates(Date.now(), 0)).toEqual([]);
  });
});
