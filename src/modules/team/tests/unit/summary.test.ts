import type { Team, TeamMember } from '@/db/schema';

import { buildTeamSummary } from '../../utils/summary';

const NOW = Date.parse('2026-10-19T12:00:00.000Z');

function team(overrides: Partial<Team> = {}): Team {
  return {
    id: 'team_1',
    name: 'Equipo',
    inviteCode: 'ABC123',
    difficultyLevel: 'medio',
    durationDays: 14,
    createdAt: '2026-10-10T12:00:00.000Z',
    ...overrides,
  };
}

function member(overrides: Partial<TeamMember> = {}): TeamMember {
  return {
    id: 'member_1',
    teamId: 'team_1',
    userName: 'Tú',
    dailyLimit: 15,
    role: 'leader',
    joinedAt: '2026-10-10T12:00:00.000Z',
    postponedCount: 0,
    smokedToday: 0,
    streakDays: 0,
    hadStumble: 0,
    ...overrides,
  };
}

describe('buildTeamSummary', () => {
  it('computes collective metrics and remaining days', () => {
    const summary = buildTeamSummary(
      team(),
      [
        member({ postponedCount: 5 }),
        member({ id: 'member_2', userName: 'Ana', postponedCount: 3 }),
      ],
      5,
      NOW,
    );

    expect(summary.collectivePostponed).toBe(8);
    expect(summary.avoidedCigarettes).toBe(8);
    expect(summary.moneySaved).toBeCloseTo(2);
    expect(summary.remainingDays).toBe(5);
    expect(summary.expired).toBe(false);
  });

  it('clamps negative member counts and marks expired challenges', () => {
    const summary = buildTeamSummary(
      team({ createdAt: '2026-09-01T00:00:00.000Z', durationDays: 7 }),
      [member({ postponedCount: -2 })],
      0,
      NOW,
    );

    expect(summary.collectivePostponed).toBe(0);
    expect(summary.moneySaved).toBe(0);
    expect(summary.remainingDays).toBe(0);
    expect(summary.expired).toBe(true);
  });
});
