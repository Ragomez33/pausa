import {
  buildTriggerBreakdown,
  computePauseAnalytics,
  computeStreakParts,
  computeStreakStart,
  computeSuccessRate,
} from '../../utils/analytics';

const PROFILE_START = Date.parse('2026-10-01T00:00:00.000Z');
const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;

describe('computeSuccessRate', () => {
  it('computes resisted over total as a percentage', () => {
    expect(computeSuccessRate(3, 4)).toBe(75);
    expect(computeSuccessRate(0, 4)).toBe(0);
    expect(computeSuccessRate(4, 4)).toBe(100);
  });

  it('is zero-safe', () => {
    expect(computeSuccessRate(0, 0)).toBe(0);
    expect(computeSuccessRate(-1, 4)).toBe(0);
    expect(computeSuccessRate(1, Number.NaN)).toBe(0);
  });
});

describe('computeStreakStart', () => {
  it('uses the profile creation time when there is no ceded event', () => {
    expect(computeStreakStart('2026-10-01T00:00:00.000Z', null)).toBe(PROFILE_START);
  });

  it('uses a later ceded event', () => {
    const ceded = new Date(PROFILE_START + 2 * DAY_MS).toISOString();
    expect(computeStreakStart('2026-10-01T00:00:00.000Z', ceded)).toBe(
      PROFILE_START + 2 * DAY_MS,
    );
  });

  it('ignores a ceded event older than the profile', () => {
    expect(computeStreakStart('2026-10-01T00:00:00.000Z', '2026-09-01T00:00:00.000Z')).toBe(
      PROFILE_START,
    );
  });

  it('falls back safely for invalid values', () => {
    expect(computeStreakStart('not-a-date', null)).toBe(0);
    expect(computeStreakStart('not-a-date', 'also-invalid')).toBe(0);
  });
});

describe('computeStreakParts', () => {
  it('splits elapsed time into days and hours', () => {
    expect(computeStreakParts(3 * DAY_MS + 4 * HOUR_MS + 30 * 60_000)).toEqual({
      days: 3,
      hours: 4,
    });
  });

  it('returns zero for negative or invalid values', () => {
    expect(computeStreakParts(-1)).toEqual({ days: 0, hours: 0 });
    expect(computeStreakParts(Number.NaN)).toEqual({ days: 0, hours: 0 });
  });
});

describe('buildTriggerBreakdown', () => {
  it('computes percentages and sorts by count descending', () => {
    const result = buildTriggerBreakdown([
      { triggerEmotion: 'stress', count: 1 },
      { triggerEmotion: 'anxiety', count: 3 },
      { triggerEmotion: 'boredom', count: 0 },
    ]);

    expect(result).toHaveLength(2);
    expect(result[0].triggerEmotion).toBe('anxiety');
    expect(result[0].label).toBe('Ansiedad');
    expect(result[0].count).toBe(3);
    expect(result[0].percentage).toBe(75);
    expect(result[1].triggerEmotion).toBe('stress');
    expect(result[1].percentage).toBe(25);
  });

  it('uses a deterministic label tie-break', () => {
    const result = buildTriggerBreakdown([
      { triggerEmotion: 'stress', count: 2 },
      { triggerEmotion: 'anxiety', count: 2 },
    ]);

    expect(result[0].label).toBe('Ansiedad');
    expect(result[1].label).toBe('Estrés');
  });

  it('returns an empty list when there are no observed triggers', () => {
    expect(buildTriggerBreakdown([])).toEqual([]);
    expect(buildTriggerBreakdown([{ triggerEmotion: 'anxiety', count: 0 }])).toEqual([]);
  });
});

describe('computePauseAnalytics', () => {
  it('combines totals, streak, and triggers', () => {
    const now = PROFILE_START + 3 * DAY_MS + 4 * HOUR_MS;
    const analytics = computePauseAnalytics(
      { total: 4, resisted: 3, ceded: 1 },
      [
        { triggerEmotion: 'anxiety', count: 3 },
        { triggerEmotion: 'work_stress', count: 1 },
      ],
      '2026-10-01T00:00:00.000Z',
      null,
      now,
    );

    expect(analytics.total).toBe(4);
    expect(analytics.resisted).toBe(3);
    expect(analytics.ceded).toBe(1);
    expect(analytics.successRate).toBe(75);
    expect(analytics.streakDays).toBe(3);
    expect(analytics.streakHours).toBe(4);
    expect(analytics.triggers[1].label).toBe('Estrés laboral');
  });

  it('restarts from the latest ceded event', () => {
    const ceded = new Date(PROFILE_START + 2 * DAY_MS).toISOString();
    const analytics = computePauseAnalytics(
      { total: 1, resisted: 0, ceded: 1 },
      [],
      '2026-10-01T00:00:00.000Z',
      ceded,
      PROFILE_START + 2 * DAY_MS + HOUR_MS,
    );

    expect(analytics.streakDays).toBe(0);
    expect(analytics.streakHours).toBe(1);
    expect(analytics.successRate).toBe(0);
  });

  it('clamps clock skew to zero elapsed time', () => {
    const analytics = computePauseAnalytics(
      { total: 0, resisted: 0, ceded: 0 },
      [],
      '2026-10-01T00:00:00.000Z',
      null,
      PROFILE_START - DAY_MS,
    );

    expect(analytics.elapsedMs).toBe(0);
    expect(analytics.streakDays).toBe(0);
    expect(analytics.streakHours).toBe(0);
    expect(analytics.successRate).toBe(0);
    expect(analytics.triggers).toEqual([]);
  });
});
