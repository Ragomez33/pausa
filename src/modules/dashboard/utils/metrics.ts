import type { InventoryLog, PauseEvent, UserProfile } from '@/db/schema';
import type { HomeMetrics } from '@/shared/types/global';
import {
  DAY_MS,
  computeAvoidedCigarettes,
  computeElapsedMs,
  computeMoneySaved,
  parseIsoTimestamp,
  resolveStreakStartMs,
} from '@/shared/utils/derivedMetrics';import { computeInventorySummary } from '@/shared/utils/inventory';

export { DAY_MS, computeAvoidedCigarettes, computeElapsedMs, computeMoneySaved };

export function resolveStreakStart(profile: UserProfile, events: PauseEvent[]): number {
  let latestCeded: string | null = null;
  let latestCededMs: number | null = null;

  for (const event of events) {
    if (event.resisted !== 0) {
      continue;
    }
    const parsed = parseIsoTimestamp(event.timestamp);
    if (parsed !== null && (latestCededMs === null || parsed > latestCededMs)) {
      latestCeded = event.timestamp;
      latestCededMs = parsed;
    }
  }

  return resolveStreakStartMs(profile.createdAt, latestCeded);
}

export function countResisted(events: PauseEvent[]): number {
  return events.filter((event) => event.resisted === 1).length;
}

export function countCeded(events: PauseEvent[]): number {
  return events.filter((event) => event.resisted === 0).length;
}

export function formatCigarettes(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) {
    return '0';
  }
  return amount.toFixed(1).replace(/\.0$/, '');
}

export function computeHomeMetrics(
  profile: UserProfile,
  events: PauseEvent[],
  nowMs: number,
  inventoryLogs: InventoryLog[] = [],
  smokedToday = 0,
  pausedToday = countResisted(events),
  latestCededTimestamp: string | null = null,
): HomeMetrics {
  const pauseStreakStartMs = resolveStreakStart(profile, events);
  const cededStartMs = parseIsoTimestamp(latestCededTimestamp);
  const streakStartMs =
    cededStartMs !== null && cededStartMs > pauseStreakStartMs
      ? cededStartMs
      : pauseStreakStartMs;
  const elapsedMs = computeElapsedMs(streakStartMs, nowMs);
  const avoidedCigarettes = computeAvoidedCigarettes(profile.dailyCigarettes, elapsedMs);
  const moneySaved = computeMoneySaved(avoidedCigarettes, profile.packCost);
  const inventorySpending = computeInventorySummary(
    inventoryLogs,
    profile.dailyCigarettes,
    profile.currency,
  ).totalSpending;

  return {
    resistedCount: pausedToday,
    cededCount: smokedToday,
    elapsedMs,
    streakStart: new Date(streakStartMs).toISOString(),
    avoidedCigarettes,
    moneySaved,
    inventorySpending,
    smokedToday,
    dailyLimit: profile.dailyCigarettes,
    currency: profile.currency,
  };
}
