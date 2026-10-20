import { CIGARETTES_PER_PACK } from '@/shared/constants/app';

export const DAY_MS = 86_400_000;

export function parseIsoTimestamp(value: string | null): number | null {
  if (value === null) {
    return null;
  }
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function latestIsoTimestamp(
  ...timestamps: (string | null)[]
): string | null {
  let latest: string | null = null;
  let latestMs: number | null = null;

  for (const timestamp of timestamps) {
    const parsed = parseIsoTimestamp(timestamp);
    if (parsed !== null && (latestMs === null || parsed > latestMs)) {
      latest = timestamp;
      latestMs = parsed;
    }
  }

  return latest;
}

export function resolveStreakStartMs(
  profileCreatedAt: string,
  latestCededTimestamp: string | null,
): number {
  const profileStart = parseIsoTimestamp(profileCreatedAt) ?? 0;
  const cededStart = parseIsoTimestamp(latestCededTimestamp);

  if (cededStart !== null && cededStart > profileStart) {
    return cededStart;
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
