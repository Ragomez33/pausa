export const MIN_REMINDER_INTERVAL_MINUTES = 30;
export const MAX_REMINDER_INTERVAL_MINUTES = 240;
export const DEFAULT_WAKING_HOURS = 16;

export interface IdleSchedule {
  intervalMinutes: number;
  scheduledAtMs: number;
}

export function calculateIdleIntervalMinutes(
  dailyCigarettes: number,
  wakingHours = DEFAULT_WAKING_HOURS,
): number {
  if (!Number.isFinite(dailyCigarettes) || dailyCigarettes <= 0) {
    return MAX_REMINDER_INTERVAL_MINUTES;
  }
  const safeWakingHours =
    Number.isFinite(wakingHours) && wakingHours > 0 ? wakingHours : DEFAULT_WAKING_HOURS;
  const rawInterval = (safeWakingHours * 60) / dailyCigarettes;
  return Math.min(
    MAX_REMINDER_INTERVAL_MINUTES,
    Math.max(MIN_REMINDER_INTERVAL_MINUTES, rawInterval),
  );
}

export function computeIdleSchedule(nowMs: number, dailyCigarettes: number): IdleSchedule {
  const safeNow = Number.isFinite(nowMs) ? nowMs : Date.now();
  const intervalMinutes = calculateIdleIntervalMinutes(dailyCigarettes);
  return {
    intervalMinutes,
    scheduledAtMs: safeNow + intervalMinutes * 60_000,
  };
}

/**
 * Anchors the next idle reminder to the last real habit interaction instead of
 * "now". Opening the app therefore no longer postpones the reminder: the target
 * keeps the original interaction + interval. When that target is already in the
 * past (the reminder was missed or the user stayed in the app), a full new
 * interval starts from `nowMs` to avoid firing immediately on foreground.
 */
export function computeIdleScheduleFromAnchor(
  lastInteractionAtMs: number,
  nowMs: number,
  dailyCigarettes: number,
): IdleSchedule {
  const safeNow = Number.isFinite(nowMs) ? nowMs : Date.now();
  const intervalMinutes = calculateIdleIntervalMinutes(dailyCigarettes);
  const intervalMs = intervalMinutes * 60_000;
  const anchorMs = Number.isFinite(lastInteractionAtMs) ? lastInteractionAtMs : safeNow;
  const anchorTargetMs = anchorMs + intervalMs;

  return {
    intervalMinutes,
    scheduledAtMs: anchorTargetMs > safeNow ? anchorTargetMs : safeNow + intervalMs,
  };
}
