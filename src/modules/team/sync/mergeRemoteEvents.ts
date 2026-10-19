import type { TeamMember } from '@/db/schema';

export interface SharedEvent {
  id: string;
  teamId: string;
  userName: string;
  eventType: 'posponed' | 'smoked';
  timestamp: string;
}

const MAX_STREAK_DAYS = 3_650;

function dayKey(ms: number): string {
  const date = new Date(ms);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function startOfLocalDay(ms: number): number {
  const date = new Date(ms);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function dedupeEvents(events: SharedEvent[]): SharedEvent[] {
  const seen = new Set<string>();
  return events.filter((event) => {
    if (seen.has(event.id)) {
      return false;
    }
    seen.add(event.id);
    return true;
  });
}

export function mergeRemoteMembers(
  members: TeamMember[],
  remoteEvents: SharedEvent[],
  localUserName: string,
  nowMs: number,
): TeamMember[] {
  const events = dedupeEvents(remoteEvents);
  const todayKey = dayKey(nowMs);

  return members.map((member) => {
    if (member.userName === localUserName) {
      return member;
    }

    const memberEvents = events.filter((event) => event.userName === member.userName);
    if (memberEvents.length === 0) {
      return member;
    }

    const postponedCount = memberEvents.filter(
      (event) => event.eventType === 'posponed',
    ).length;
    const smokedPerDay = new Map<string, number>();

    for (const event of memberEvents) {
      if (event.eventType !== 'smoked') {
        continue;
      }
      const parsed = Date.parse(event.timestamp);
      if (!Number.isFinite(parsed)) {
        continue;
      }
      const key = dayKey(parsed);
      smokedPerDay.set(key, (smokedPerDay.get(key) ?? 0) + 1);
    }

    const smokedToday = smokedPerDay.get(todayKey) ?? 0;
    const hadStumble = Array.from(smokedPerDay.values()).some(
      (count) => count > 0 && count <= member.dailyLimit,
    );

    const joinedMs = Date.parse(member.joinedAt);
    const joinedDay = Number.isFinite(joinedMs) ? startOfLocalDay(joinedMs) : startOfLocalDay(nowMs);
    let streakDays = 0;
    let cursor = startOfLocalDay(nowMs);

    for (let index = 0; index < MAX_STREAK_DAYS; index += 1) {
      if (cursor < joinedDay) {
        break;
      }
      const count = smokedPerDay.get(dayKey(cursor)) ?? 0;
      if (count > member.dailyLimit) {
        break;
      }
      streakDays += 1;
      const previous = new Date(cursor);
      previous.setDate(previous.getDate() - 1);
      cursor = previous.getTime();
    }

    return {
      ...member,
      postponedCount,
      smokedToday,
      streakDays,
      hadStumble: hadStumble ? 1 : 0,
    };
  });
}
