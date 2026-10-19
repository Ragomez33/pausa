import type { PauseEvent, UserProfile } from '@/db/schema';

import {
  calculateMoneySaved,
  computeHomeMetrics,
  countResisted,
  currentStreak,
} from '../../utils/metrics';

function event(id: number, resisted: boolean): PauseEvent {
  return {
    id,
    timestamp: new Date(id).toISOString(),
    triggerEmotion: 'anxiety',
    resisted: resisted ? 1 : 0,
    notes: null,
  };
}

function profile(packCost: number): UserProfile {
  return {
    id: 1,
    dailyCigarettes: 10,
    packCost,
    currency: 'USD',
    quitGoal: 'Salud',
    createdAt: new Date(0).toISOString(),
  };
}

describe('countResisted', () => {
  it('counts only resisted events', () => {
    expect(countResisted([event(3, true), event(2, false), event(1, true)])).toBe(2);
  });
});

describe('currentStreak', () => {
  it('counts consecutive resisted events from the most recent', () => {
    expect(currentStreak([event(3, true), event(2, true), event(1, false)])).toBe(2);
  });

  it('is zero when the most recent event was ceded', () => {
    expect(currentStreak([event(3, false), event(2, true)])).toBe(0);
  });

  it('is zero for no events', () => {
    expect(currentStreak([])).toBe(0);
  });
});

describe('calculateMoneySaved', () => {
  it('divides cost per pack by cigarettes per pack', () => {
    expect(calculateMoneySaved(4, 10)).toBeCloseTo(2);
  });

  it('returns zero when cost or count is non-positive', () => {
    expect(calculateMoneySaved(0, 10)).toBe(0);
    expect(calculateMoneySaved(4, 0)).toBe(0);
  });
});

describe('computeHomeMetrics', () => {
  it('derives all metrics from stored records', () => {
    const metrics = computeHomeMetrics(profile(10), [
      event(3, true),
      event(2, true),
      event(1, false),
    ]);

    expect(metrics.resistedCount).toBe(2);
    expect(metrics.currentStreak).toBe(2);
    expect(metrics.moneySaved).toBeCloseTo(1);
    expect(metrics.currency).toBe('USD');
  });

  it('produces a zero state with no events', () => {
    const metrics = computeHomeMetrics(profile(10), []);
    expect(metrics.resistedCount).toBe(0);
    expect(metrics.currentStreak).toBe(0);
    expect(metrics.moneySaved).toBe(0);
  });
});
