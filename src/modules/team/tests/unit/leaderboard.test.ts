import type { TeamMember } from '@/db/schema';

import { buildLeaderboard } from '../../utils/leaderboard';

function member(overrides: Partial<TeamMember>): TeamMember {
  return {
    id: 'member_1',
    teamId: 'team_1',
    userName: 'Tú',
    dailyLimit: 15,
    role: 'member',
    joinedAt: '2026-10-10T12:00:00.000Z',
    postponedCount: 0,
    smokedToday: 0,
    streakDays: 0,
    hadStumble: 0,
    ...overrides,
  };
}

describe('buildLeaderboard', () => {
  it('assigns each distinction to the strongest eligible member', () => {
    const result = buildLeaderboard([
      member({ id: 'a', userName: 'Ana', postponedCount: 8, streakDays: 3 }),
      member({ id: 'b', userName: 'Beto', postponedCount: 4, streakDays: 9 }),
      member({
        id: 'c',
        userName: 'Carla',
        postponedCount: 2,
        streakDays: 5,
        smokedToday: 10,
        dailyLimit: 15,
        hadStumble: 1,
      }),
    ]);

    expect(result.guardian?.userName).toBe('Ana');
    expect(result.unbreakable?.userName).toBe('Beto');
    expect(result.resilient?.userName).toBe('Carla');
  });

  it('requires Resiliente to have stumbled and stayed within the limit', () => {
    const result = buildLeaderboard([
      member({ id: 'a', userName: 'Ana', hadStumble: 0, smokedToday: 2 }),
      member({ id: 'b', userName: 'Beto', hadStumble: 1, smokedToday: 20, dailyLimit: 15 }),
    ]);

    expect(result.resilient).toBeNull();
  });

  it('resolves ties by user name then id', () => {
    const result = buildLeaderboard([
      member({ id: 'b', userName: 'Beto', postponedCount: 5 }),
      member({ id: 'a', userName: 'Ana', postponedCount: 5 }),
    ]);

    expect(result.guardian?.userName).toBe('Ana');
  });

  it('returns null distinctions when no member is eligible', () => {
    const result = buildLeaderboard([
      member({ id: 'a', userName: 'Ana', postponedCount: 0, streakDays: 0 }),
    ]);

    expect(result.guardian).toBeNull();
    expect(result.unbreakable).toBeNull();
  });
});
