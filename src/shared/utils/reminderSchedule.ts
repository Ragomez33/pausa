export const MIN_REMINDER_INTERVAL_MINUTES = 30;
export const DEFAULT_WAKING_HOURS = 16;
export const DEFAULT_WAKING_START_HOUR = 8;
export const DEFAULT_WAKING_END_HOUR = 22;
const DAY_MS = 86_400_000;

export function calculateReminderIntervalMinutes(
  dailyCigarettes: number,
  wakingHours = DEFAULT_WAKING_HOURS,
): number {
  if (!Number.isFinite(dailyCigarettes) || dailyCigarettes <= 0) {
    return MIN_REMINDER_INTERVAL_MINUTES;
  }
  const safeWakingHours =
    Number.isFinite(wakingHours) && wakingHours > 0 ? wakingHours : DEFAULT_WAKING_HOURS;
  const interval = (safeWakingHours * 60) / dailyCigarettes;
  return Math.max(MIN_REMINDER_INTERVAL_MINUTES, interval);
}

export function buildReminderDates(
  nowMs: number,
  intervalMinutes: number,
  wakingStartHour = DEFAULT_WAKING_START_HOUR,
  wakingEndHour = DEFAULT_WAKING_END_HOUR,
): number[] {
  if (!Number.isFinite(nowMs) || !Number.isFinite(intervalMinutes) || intervalMinutes <= 0) {
    return [];
  }

  const intervalMs = intervalMinutes * 60_000;
  const horizon = nowMs + DAY_MS;
  const results: number[] = [];
  const base = new Date(nowMs);

  for (let dayOffset = 0; dayOffset <= 1; dayOffset += 1) {
    const dayStart = new Date(
      base.getFullYear(),
      base.getMonth(),
      base.getDate() + dayOffset,
      wakingStartHour,
      0,
      0,
      0,
    ).getTime();
    const dayEnd = new Date(
      base.getFullYear(),
      base.getMonth(),
      base.getDate() + dayOffset,
      wakingEndHour,
      0,
      0,
      0,
    ).getTime();

    let cursor = dayStart;
    while (cursor <= dayEnd && cursor <= horizon) {
      if (cursor > nowMs) {
        results.push(cursor);
      }
      cursor += intervalMs;
    }
  }

  return results;
}
