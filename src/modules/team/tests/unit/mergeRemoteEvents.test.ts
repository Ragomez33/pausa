import type { TeamMember } from '@/db/schema';

import type { SharedEvent } from '../../sync/mergeRemoteEvents';
import { mergeRemoteMembers } from '../../sync/mergeRemoteEvents';

const NOW = new Date(2026, 9, 19, 12, 0, 0, 0).getTime();
const DAY_MS = 86_400_000;

function member(overrides: Partial<TeamMember>): TeamMember {
  return {
    id: 'member_1',
    teamId: 'team_1',
    userName: 'Tú',
    dailyLimit: 10,
    role: 'member',
    joinedAt: new Date(NOW - 10 * DAY_MS).toISOString(),
    postponedCount: 0,
    smokedToday: 0,
    streakDays: 0,
    hadStumble: 0,
    ...overrides,
  };
}

function event(
  id: string,
  userName: string,
  eventType: 'posponed' | 'smoked',
  offsetDays = 0,
): SharedEvent {
  return {
    id,
    teamId: 'team_1',
    userName,
    eventType,
    timestamp: new Date(NOW - offsetDays * DAY_MS).toISOString(),
  };
}

describe('mergeRemoteMembers', () => {
  it('keeps local snapshot values for the local user', () => {
    const local = member({ userName: 'Tú', postponedCount: 7, smokedToday: 3 });
    const result = mergeRemoteMembers(
      [local],
      [event('e1', 'Tú', 'posponed'), event('e2', 'Tú', 'smoked')],
      'Tú',
      NOW,
    );

    expect(result[0]).toBe(local);
  });

  it('derives postponed, smoked-today, streak, and stumble for remote members', () => {
    const remote = member({ id: 'm2', userName: 'Ana', dailyLimit: 2 });
    const result = mergeRemoteMembers(
      [remote],
      [
        event('e1', 'Ana', 'posponed'),
        event('e2', 'Ana', 'posponed'),
        event('e3', 'Ana', 'smoked', 0),
        event('e4', 'Ana', 'smoked', 1),
        event('e5', 'Ana', 'smoked', 2),
        event('e6', 'Ana', 'smoked', 2),
        event('e7', 'Ana', 'smoked', 2),
      ],
      'Tú',
      NOW,
    );

    expect(result[0].postponedCount).toBe(2);
    expect(result[0].smokedToday).toBe(1);
    expect(result[0].streakDays).toBe(2);
    expect(result[0].hadStumble).toBe(1);
  });

  it('deduplicates events by id', () => {
    const remote = member({ id: 'm2', userName: 'Ana' });
    const duplicated = event('same', 'Ana', 'posponed');
    const result = mergeRemoteMembers(
      [remote],
      [duplicated, duplicated],
      'Tú',
      NOW,
    );

    expect(result[0].postponedCount).toBe(1);
  });

  it('ignores events from unknown members', () => {
    const remote = member({ id: 'm2', userName: 'Ana' });
    const result = mergeRemoteMembers(
      [remote],
      [event('e1', 'Desconocido', 'posponed')],
      'Tú',
      NOW,
    );

    expect(result[0].postponedCount).toBe(0);
  });
});
