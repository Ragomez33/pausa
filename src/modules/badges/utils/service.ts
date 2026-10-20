import type { UserBadge, UserProfile } from '@/db/schema';
import {
  getLatestCededTimestamp,
  getPauseTotals,
  getProfile,
  listUserBadges,
  unlockBadges,
} from '@/db/queries';
import type { BadgeDefinition } from './catalog';
import { BADGE_CATALOG } from './catalog';
import type { BadgeState } from './evaluate';
import { evaluateBadges } from './evaluate';
import {
  DAY_MS,
  computeAvoidedCigarettes,
  computeElapsedMs,
  computeMoneySaved,
  resolveStreakStartMs,
} from '@/shared/utils/derivedMetrics';

export interface BadgeEvaluationOutcome {
  newBadges: BadgeDefinition[];
  newBadgeRows: UserBadge[];
  error: Error | null;
}

export function buildBadgeState(
  profile: UserProfile,
  totals: { resisted: number },
  latestCededTimestamp: string | null,
  nowMs: number,
): BadgeState {
  const streakStartMs = resolveStreakStartMs(profile.createdAt, latestCededTimestamp);
  const elapsedMs = computeElapsedMs(streakStartMs, nowMs);
  const avoidedCigarettes = computeAvoidedCigarettes(profile.dailyCigarettes, elapsedMs);
  const moneySaved = computeMoneySaved(avoidedCigarettes, profile.packCost);

  return {
    resistedPauses: totals.resisted,
    streakDays: elapsedMs / DAY_MS,
    moneySaved,
  };
}

export function evaluateAndUnlockBadges(nowMs: number): BadgeEvaluationOutcome {
  try {
    const profile = getProfile();
    if (profile === null) {
      return { newBadges: [], newBadgeRows: [], error: null };
    }

    const totals = getPauseTotals();
    const latestCeded = getLatestCededTimestamp();
    const state = buildBadgeState(profile, totals, latestCeded, nowMs);
    const unlockedKeys = listUserBadges().map((badge) => badge.badgeKey);
    const { newKeys } = evaluateBadges(state, unlockedKeys);

    if (newKeys.length === 0) {
      return { newBadges: [], newBadgeRows: [], error: null };
    }

    const unlockedAt = new Date(nowMs).toISOString();
    const newBadgeRows = unlockBadges(
      newKeys.map((badgeKey) => ({ badgeKey, unlockedAt })),
    );

    return {
      newBadges: BADGE_CATALOG.filter((definition) => newKeys.includes(definition.key)),
      newBadgeRows,
      error: null,
    };
  } catch (caught) {
    return {
      newBadges: [],
      newBadgeRows: [],
      error: caught instanceof Error ? caught : new Error('No se pudieron evaluar los logros.'),
    };
  }
}
