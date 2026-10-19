import type { PauseTotals, TriggerCount } from '@/shared/types/global';
import { getTriggerLabel } from '@/shared/utils/triggers';

const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;

export interface TriggerBreakdown {
  triggerEmotion: string;
  label: string;
  count: number;
  percentage: number;
}

export interface PauseAnalytics {
  total: number;
  resisted: number;
  ceded: number;
  successRate: number;
  streakStart: string;
  elapsedMs: number;
  streakDays: number;
  streakHours: number;
  triggers: TriggerBreakdown[];
}

function parseTimestamp(value: string | null): number | null {
  if (value === null) {
    return null;
  }
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function computeSuccessRate(resisted: number, total: number): number {
  if (!Number.isFinite(resisted) || !Number.isFinite(total) || total <= 0) {
    return 0;
  }
  return Math.min(100, Math.max(0, (resisted / total) * 100));
}

export function computeStreakStart(
  profileCreatedAt: string,
  latestCededTimestamp: string | null,
): number {
  const profileStart = parseTimestamp(profileCreatedAt) ?? 0;
  const cededStart = parseTimestamp(latestCededTimestamp);

  if (cededStart !== null && cededStart > profileStart) {
    return cededStart;
  }
  return profileStart;
}

export function computeStreakParts(elapsedMs: number): { days: number; hours: number } {
  if (!Number.isFinite(elapsedMs) || elapsedMs <= 0) {
    return { days: 0, hours: 0 };
  }
  return {
    days: Math.floor(elapsedMs / DAY_MS),
    hours: Math.floor((elapsedMs % DAY_MS) / HOUR_MS),
  };
}

export function buildTriggerBreakdown(counts: TriggerCount[]): TriggerBreakdown[] {
  const observed = counts.filter((entry) => entry.count > 0);
  const total = observed.reduce((sum, entry) => sum + entry.count, 0);

  return observed
    .map((entry) => ({
      triggerEmotion: entry.triggerEmotion,
      label: getTriggerLabel(entry.triggerEmotion),
      count: entry.count,
      percentage: total > 0 ? (entry.count / total) * 100 : 0,
    }))
    .sort((left, right) => {
      if (right.count !== left.count) {
        return right.count - left.count;
      }
      return left.label.localeCompare(right.label);
    });
}

export function computePauseAnalytics(
  totals: PauseTotals,
  counts: TriggerCount[],
  profileCreatedAt: string,
  latestCededTimestamp: string | null,
  nowMs: number,
): PauseAnalytics {
  const streakStartMs = computeStreakStart(profileCreatedAt, latestCededTimestamp);
  const elapsedMs =
    Number.isFinite(nowMs) && Number.isFinite(streakStartMs)
      ? Math.max(0, nowMs - streakStartMs)
      : 0;
  const streak = computeStreakParts(elapsedMs);

  return {
    total: totals.total,
    resisted: totals.resisted,
    ceded: totals.ceded,
    successRate: computeSuccessRate(totals.resisted, totals.total),
    streakStart: new Date(streakStartMs).toISOString(),
    elapsedMs,
    streakDays: streak.days,
    streakHours: streak.hours,
    triggers: buildTriggerBreakdown(counts),
  };
}
