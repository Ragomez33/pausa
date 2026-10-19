import type { TeamMember } from '@/db/schema';

export interface TeamLeaderboard {
  guardian: TeamMember | null;
  unbreakable: TeamMember | null;
  resilient: TeamMember | null;
}

function compareMembers(left: TeamMember, right: TeamMember): number {
  const byName = left.userName.localeCompare(right.userName);
  if (byName !== 0) {
    return byName;
  }
  return left.id.localeCompare(right.id);
}

function pickTop(
  members: TeamMember[],
  score: (member: TeamMember) => number,
  eligible: (member: TeamMember) => boolean = () => true,
): TeamMember | null {
  const candidates = members.filter(eligible);
  if (candidates.length === 0) {
    return null;
  }
  return candidates.reduce((best, current) => {
    const bestScore = score(best);
    const currentScore = score(current);
    if (currentScore > bestScore) {
      return current;
    }
    if (currentScore < bestScore) {
      return best;
    }
    return compareMembers(current, best) < 0 ? current : best;
  });
}

export function buildLeaderboard(members: TeamMember[]): TeamLeaderboard {
  const guardian = pickTop(
    members,
    (member) => member.postponedCount,
    (member) => member.postponedCount > 0,
  );

  const unbreakable = pickTop(
    members,
    (member) => member.streakDays,
    (member) => member.streakDays > 0,
  );

  const resilient = pickTop(
    members,
    (member) => member.streakDays,
    (member) =>
      member.hadStumble === 1 && member.smokedToday <= member.dailyLimit,
  );

  return { guardian, unbreakable, resilient };
}
