import type { Team, TeamMember } from '@/db/schema';
import { CIGARETTES_PER_PACK } from '@/shared/constants/app';

const DAY_MS = 86_400_000;

export interface TeamSummary {
  team: Team;
  members: TeamMember[];
  collectivePostponed: number;
  avoidedCigarettes: number;
  moneySaved: number;
  remainingDays: number;
  expired: boolean;
}

export function buildTeamSummary(
  team: Team,
  members: TeamMember[],
  packCost: number,
  nowMs: number,
): TeamSummary {
  const collectivePostponed = members.reduce(
    (sum, member) => sum + Math.max(0, member.postponedCount),
    0,
  );
  const avoidedCigarettes = collectivePostponed;
  const safePackCost = Number.isFinite(packCost) && packCost > 0 ? packCost : 0;
  const moneySaved = (avoidedCigarettes / CIGARETTES_PER_PACK) * safePackCost;

  const createdMs = Date.parse(team.createdAt);
  const endMs = Number.isFinite(createdMs)
    ? createdMs + team.durationDays * DAY_MS
    : nowMs;
  const remainingMs = endMs - nowMs;
  const remainingDays = Math.max(0, Math.ceil(remainingMs / DAY_MS));

  return {
    team,
    members,
    collectivePostponed,
    avoidedCigarettes,
    moneySaved,
    remainingDays,
    expired: remainingMs <= 0,
  };
}
