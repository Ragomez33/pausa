import type { InventoryLog, PauseEvent, UserProfile } from '@/db/schema';

import { latestIsoTimestamp } from '@/shared/utils/derivedMetrics';

import {
  computeAvoidedCigarettes,
  computeElapsedMs,
  computeHomeMetrics,
  computeMoneySaved,
  countCeded,
  countResisted,
  formatCigarettes,
  resolveStreakStart,
} from '../../utils/metrics';

const DAY_MS = 86_400_000;
const PROFILE_START = Date.parse('2026-10-01T00:00:00.000Z');

function profile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: 1,
    dailyCigarettes: 10,
    packCost: 5,
    currency: 'USD',
    quitGoal: 'Salud',
    createdAt: '2026-10-01T00:00:00.000Z',
    postponedCount: 0,
    ...overrides,
  };
}

function event(id: number, resisted: boolean, offsetDays: number): PauseEvent {
  return {
    id,
    timestamp: new Date(PROFILE_START + offsetDays * DAY_MS).toISOString(),
    triggerEmotion: 'anxiety',
    resisted: resisted ? 1 : 0,
    notes: null,
  };
}

function inventoryLog(
  id: number,
  actionType: 'purchase' | 'consumption',
  quantity: number,
  cost: number | null = null,
): InventoryLog {
  return {
    id,
    timestamp: new Date(PROFILE_START + id * 1_000).toISOString(),
    actionType,
    quantity,
    cost,
  };
}

describe('resolveStreakStart', () => {
  it('uses the profile creation timestamp when there are no ceded events', () => {
    expect(resolveStreakStart(profile(), [event(1, true, 1)])).toBe(PROFILE_START);
  });

  it('uses the latest ceded event as the new streak start', () => {
    const events = [event(3, false, 3), event(2, false, 2), event(1, true, 1)];
    expect(resolveStreakStart(profile(), events)).toBe(PROFILE_START + 3 * DAY_MS);
  });

  it('ignores a ceded event older than the profile creation time', () => {
    const legacy = { ...event(1, false, -1), timestamp: '2026-09-01T00:00:00.000Z' };
    expect(resolveStreakStart(profile(), [legacy])).toBe(PROFILE_START);
  });

  it('falls back to the profile start when the ceded timestamp is invalid', () => {
    const invalid = { ...event(1, false, 1), timestamp: 'not-a-date' };
    expect(resolveStreakStart(profile(), [invalid])).toBe(PROFILE_START);
  });
});

describe('computeElapsedMs', () => {
  it('returns the difference when now is later', () => {
    expect(computeElapsedMs(PROFILE_START, PROFILE_START + DAY_MS)).toBe(DAY_MS);
  });

  it('never returns a negative value', () => {
    expect(computeElapsedMs(PROFILE_START, PROFILE_START - DAY_MS)).toBe(0);
  });

  it('returns zero for non-finite inputs', () => {
    expect(computeElapsedMs(Number.NaN, PROFILE_START)).toBe(0);
    expect(computeElapsedMs(PROFILE_START, Number.POSITIVE_INFINITY)).toBe(0);
  });
});

describe('computeAvoidedCigarettes', () => {
  it('multiplies the daily average by elapsed days', () => {
    expect(computeAvoidedCigarettes(10, DAY_MS * 2.5)).toBeCloseTo(25);
  });

  it('returns zero for non-positive daily averages or elapsed time', () => {
    expect(computeAvoidedCigarettes(0, DAY_MS)).toBe(0);
    expect(computeAvoidedCigarettes(-2, DAY_MS)).toBe(0);
    expect(computeAvoidedCigarettes(10, 0)).toBe(0);
  });
});

describe('computeMoneySaved', () => {
  it('divides avoided cigarettes by a pack of 20 and multiplies by cost', () => {
    expect(computeMoneySaved(10, 5)).toBeCloseTo(2.5);
  });

  it('returns zero when avoided cigarettes or pack cost are non-positive', () => {
    expect(computeMoneySaved(0, 5)).toBe(0);
    expect(computeMoneySaved(10, 0)).toBe(0);
    expect(computeMoneySaved(10, -1)).toBe(0);
  });
});

describe('countResisted and countCeded', () => {
  it('counts lifetime outcomes independently', () => {
    const events = [event(4, true, 4), event(3, false, 3), event(2, true, 2), event(1, false, 1)];
    expect(countResisted(events)).toBe(2);
    expect(countCeded(events)).toBe(2);
  });

  it('is zero for no events', () => {
    expect(countResisted([])).toBe(0);
    expect(countCeded([])).toBe(0);
  });
});

describe('computeHomeMetrics', () => {
  it('derives all values from a profile with no events', () => {
    const metrics = computeHomeMetrics(profile(), [], PROFILE_START + DAY_MS);

    expect(metrics.elapsedMs).toBe(DAY_MS);
    expect(metrics.streakStart).toBe(profile().createdAt);
    expect(metrics.avoidedCigarettes).toBeCloseTo(10);
    expect(metrics.moneySaved).toBeCloseTo(2.5);
    expect(metrics.resistedCount).toBe(0);
    expect(metrics.cededCount).toBe(0);
    expect(metrics.currency).toBe('USD');
  });

  it('resets the savings window after a ceded impulse while keeping lifetime counts', () => {
    const events = [event(2, false, 2), event(1, true, 1)];
    const metrics = computeHomeMetrics(
      profile(),
      events,
      PROFILE_START + 4 * DAY_MS,
      [],
      1,
    );

    expect(metrics.elapsedMs).toBe(2 * DAY_MS);
    expect(metrics.avoidedCigarettes).toBeCloseTo(20);
    expect(metrics.moneySaved).toBeCloseTo(5);
    expect(metrics.resistedCount).toBe(1);
    expect(metrics.cededCount).toBe(1);
  });

  it('does not reset the window for resisted impulses', () => {
    const events = [event(1, true, 3)];
    const metrics = computeHomeMetrics(profile(), events, PROFILE_START + 4 * DAY_MS);

    expect(metrics.elapsedMs).toBe(4 * DAY_MS);
    expect(metrics.avoidedCigarettes).toBeCloseTo(40);
    expect(metrics.moneySaved).toBeCloseTo(10);
  });

  it('clamps a future streak start to zero elapsed time', () => {
    const events = [event(1, false, 5)];
    const metrics = computeHomeMetrics(profile(), events, PROFILE_START + 4 * DAY_MS);

    expect(metrics.elapsedMs).toBe(0);
    expect(metrics.avoidedCigarettes).toBe(0);
    expect(metrics.moneySaved).toBe(0);
  });

  it('returns zero derived values for a zero-cost/zero-consumption profile', () => {
    const metrics = computeHomeMetrics(
      profile({ dailyCigarettes: 0, packCost: 0 }),
      [],
      PROFILE_START + DAY_MS,
    );

    expect(metrics.avoidedCigarettes).toBe(0);
    expect(metrics.moneySaved).toBe(0);
  });

  it('includes inventory spending from purchase costs only', () => {
    const logs = [
      inventoryLog(4, 'purchase', 20, 5.5),
      inventoryLog(3, 'purchase', 20, null),
      inventoryLog(2, 'consumption', 10),
      inventoryLog(1, 'purchase', 20, 3),
    ];
    const metrics = computeHomeMetrics(profile(), [], PROFILE_START, logs);

    expect(metrics.inventorySpending).toBeCloseTo(8.5);
  });

  it('reports zero inventory spending when no purchase cost is provided', () => {
    const metrics = computeHomeMetrics(
      profile(),
      [],
      PROFILE_START,
      [inventoryLog(1, 'purchase', 20, null)],
    );

    expect(metrics.inventorySpending).toBe(0);
  });

  it('includes today smoked count and the profile daily limit', () => {
    const metrics = computeHomeMetrics(
      profile({ dailyCigarettes: 8 }),
      [],
      PROFILE_START,
      [],
      3,
      2,
    );

    expect(metrics.smokedToday).toBe(3);
    expect(metrics.cededCount).toBe(3);
    expect(metrics.resistedCount).toBe(2);
    expect(metrics.dailyLimit).toBe(8);
  });

  it('defaults today smoked count to zero', () => {
    const metrics = computeHomeMetrics(profile(), [], PROFILE_START);

    expect(metrics.smokedToday).toBe(0);
  });

  it('restarts the streak from the latest smoking event', () => {
    const smokedAt = new Date(PROFILE_START + 2 * DAY_MS).toISOString();
    const metrics = computeHomeMetrics(
      profile(),
      [],
      PROFILE_START + 4 * DAY_MS,
      [],
      0,
      0,
      smokedAt,
    );

    expect(metrics.elapsedMs).toBe(2 * DAY_MS);
    expect(metrics.streakStart).toBe(smokedAt);
  });
});

describe('formatCigarettes', () => {
  it('shows at most one decimal and strips trailing .0', () => {
    expect(formatCigarettes(10)).toBe('10');
    expect(formatCigarettes(1.25)).toBe('1.3');
  });

  it('returns zero for invalid or non-positive values', () => {
    expect(formatCigarettes(0)).toBe('0');
    expect(formatCigarettes(-2)).toBe('0');
    expect(formatCigarettes(Number.NaN)).toBe('0');
  });
});

describe('latestIsoTimestamp', () => {
  it('returns the newest valid timestamp across sources', () => {
    expect(
      latestIsoTimestamp(
        '2026-10-19T10:00:00.000Z',
        '2026-10-19T12:00:00.000Z',
        null,
      ),
    ).toBe('2026-10-19T12:00:00.000Z');
  });

  it('ignores invalid and missing values', () => {
    expect(latestIsoTimestamp(null, 'not-a-date')).toBeNull();
  });
});
