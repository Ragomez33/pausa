import type { InventoryLog, PauseEvent, UserProfile } from '@/db/schema';
import { CIGARETTES_PER_PACK } from '@/shared/constants/app';
import type { HomeMetrics } from '@/shared/types/global';
import { computeInventorySummary } from '@/shared/utils/inventory';

export const DAY_MS = 86_400_000;

function parseTimestamp(value: string): number | null {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function resolveStreakStart(profile: UserProfile, events: PauseEvent[]): number {
  const profileStart = parseTimestamp(profile.createdAt) ?? 0;
  let latestCeded: number | null = null;

  for (const event of events) {
    if (event.resisted !== 0) {
      continue;
    }
    const parsed = parseTimestamp(event.timestamp);
    if (parsed !== null && (latestCeded === null || parsed > latestCeded)) {
      latestCeded = parsed;
    }
  }

  if (latestCeded !== null && latestCeded > profileStart) {
    return latestCeded;
  }
  return profileStart;
}

export function computeElapsedMs(streakStartMs: number, nowMs: number): number {
  if (!Number.isFinite(streakStartMs) || !Number.isFinite(nowMs)) {
    return 0;
  }
  return Math.max(0, nowMs - streakStartMs);
}

export function computeAvoidedCigarettes(
  dailyCigarettes: number,
  elapsedMs: number,
): number {
  if (!Number.isFinite(dailyCigarettes) || dailyCigarettes <= 0) {
    return 0;
  }
  if (!Number.isFinite(elapsedMs) || elapsedMs <= 0) {
    return 0;
  }
  return dailyCigarettes * (elapsedMs / DAY_MS);
}

export function computeMoneySaved(avoidedCigarettes: number, packCost: number): number {
  if (!Number.isFinite(avoidedCigarettes) || avoidedCigarettes <= 0) {
    return 0;
  }
  if (!Number.isFinite(packCost) || packCost <= 0) {
    return 0;
  }
  return (avoidedCigarettes / CIGARETTES_PER_PACK) * packCost;
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
): HomeMetrics {
  const streakStartMs = resolveStreakStart(profile, events);
  const elapsedMs = computeElapsedMs(streakStartMs, nowMs);
  const avoidedCigarettes = computeAvoidedCigarettes(profile.dailyCigarettes, elapsedMs);
  const moneySaved = computeMoneySaved(avoidedCigarettes, profile.packCost);
  const inventorySpending = computeInventorySummary(
    inventoryLogs,
    profile.dailyCigarettes,
    profile.currency,
  ).totalSpending;

  return {
    resistedCount: countResisted(events),
    cededCount: countCeded(events),
    elapsedMs,
    streakStart: new Date(streakStartMs).toISOString(),
    avoidedCigarettes,
    moneySaved,
    inventorySpending,
    currency: profile.currency,
  };
}
