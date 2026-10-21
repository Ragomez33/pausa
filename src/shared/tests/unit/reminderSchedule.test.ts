import {
  MAX_REMINDER_INTERVAL_MINUTES,
  MIN_REMINDER_INTERVAL_MINUTES,
  calculateIdleIntervalMinutes,
  computeIdleSchedule,
  computeIdleScheduleFromAnchor,
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

describe('computeIdleScheduleFromAnchor', () => {
  const now = 10_000_000;
  const intervalMs = 48 * 60_000;

  it('keeps the target anchored to the last interaction', () => {
    const lastInteraction = now - 10 * 60_000;
    const schedule = computeIdleScheduleFromAnchor(lastInteraction, now, 20);

    expect(schedule.intervalMinutes).toBe(48);
    expect(schedule.scheduledAtMs).toBe(lastInteraction + intervalMs);
  });

  it('starts a fresh interval when the anchored target already passed', () => {
    const lastInteraction = now - 60 * 60_000;
    const schedule = computeIdleScheduleFromAnchor(lastInteraction, now, 20);

    expect(schedule.scheduledAtMs).toBe(now + intervalMs);
  });

  it('falls back to now for an invalid interaction timestamp', () => {
    const schedule = computeIdleScheduleFromAnchor(Number.NaN, now, 20);

    expect(schedule.scheduledAtMs).toBe(now + intervalMs);
  });
});
