import { BADGE_CATALOG } from '../../utils/catalog';
import { evaluateBadges, type BadgeState } from '../../utils/evaluate';

const EMPTY_STATE: BadgeState = {
  resistedPauses: 0,
  streakDays: 0,
  moneySaved: 0,
};

describe('BADGE_CATALOG', () => {
  it('has six unique keys in a stable order', () => {
    expect(BADGE_CATALOG).toHaveLength(6);
    expect(BADGE_CATALOG.map((badge) => badge.key)).toEqual([
      'first_pause',
      'five_pauses',
      '1_day_clean',
      '1_week_clean',
      '1_month_clean',
      'money_saver_10',
    ]);
    expect(new Set(BADGE_CATALOG.map((badge) => badge.key)).size).toBe(6);
  });
});

describe('evaluateBadges', () => {
  it('returns all badges locked with zero progress for an empty state', () => {
    const { statuses, newKeys } = evaluateBadges(EMPTY_STATE, []);

    expect(statuses).toHaveLength(6);
    expect(statuses.every((status) => !status.unlocked)).toBe(true);
    expect(statuses.every((status) => status.progressValue === 0)).toBe(true);
    expect(statuses.every((status) => status.progressPercent === 0)).toBe(true);
    expect(newKeys).toEqual([]);
  });

  it('unlocks the first-pause badge at one resisted pause', () => {
    const { statuses, newKeys } = evaluateBadges(
      { ...EMPTY_STATE, resistedPauses: 1 },
      [],
    );
    const firstPause = statuses.find((status) => status.definition.key === 'first_pause');

    expect(firstPause?.progressPercent).toBe(100);
    expect(newKeys).toContain('first_pause');
    expect(newKeys).not.toContain('five_pauses');
  });

  it('unlocks the five-pause badge at five resisted pauses', () => {
    const { newKeys } = evaluateBadges({ ...EMPTY_STATE, resistedPauses: 5 }, []);

    expect(newKeys).toEqual(expect.arrayContaining(['first_pause', 'five_pauses']));
  });

  it('unlocks time badges at their thresholds', () => {
    const day = evaluateBadges({ ...EMPTY_STATE, streakDays: 1 }, []).newKeys;
    const week = evaluateBadges({ ...EMPTY_STATE, streakDays: 7 }, []).newKeys;
    const month = evaluateBadges({ ...EMPTY_STATE, streakDays: 30 }, []).newKeys;

    expect(day).toContain('1_day_clean');
    expect(week).toEqual(
      expect.arrayContaining(['1_day_clean', '1_week_clean']),
    );
    expect(month).toEqual(
      expect.arrayContaining(['1_day_clean', '1_week_clean', '1_month_clean']),
    );
  });

  it('unlocks the savings badge at the threshold', () => {
    const { newKeys } = evaluateBadges({ ...EMPTY_STATE, moneySaved: 10 }, []);

    expect(newKeys).toContain('money_saver_10');
  });

  it('does not create new keys for already unlocked badges', () => {
    const { statuses, newKeys } = evaluateBadges(
      { ...EMPTY_STATE, resistedPauses: 5, streakDays: 30, moneySaved: 20 },
      ['first_pause', 'five_pauses', '1_day_clean', '1_week_clean', '1_month_clean', 'money_saver_10'],
    );

    expect(newKeys).toEqual([]);
    expect(statuses.every((status) => status.unlocked)).toBe(true);
  });

  it('caps progress at the target and never goes negative', () => {
    const { statuses } = evaluateBadges(
      { resistedPauses: 50, streakDays: -3, moneySaved: Number.NaN },
      [],
    );
    const five = statuses.find((status) => status.definition.key === 'five_pauses');
    const day = statuses.find((status) => status.definition.key === '1_day_clean');

    expect(five?.progressValue).toBe(5);
    expect(five?.progressPercent).toBe(100);
    expect(day?.progressValue).toBe(0);
    expect(day?.progressPercent).toBe(0);
  });

  it('ignores unknown unlocked keys', () => {
    const { statuses, newKeys } = evaluateBadges(EMPTY_STATE, ['unknown_badge']);

    expect(statuses).toHaveLength(6);
    expect(statuses.every((status) => !status.unlocked)).toBe(true);
    expect(newKeys).toEqual([]);
  });
});
