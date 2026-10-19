import { db } from '@/db/client';
import { getTeamByInviteCode, findTeamMember } from '@/db/queries';
import { teamMembers, teams, type Team, type TeamMember } from '@/db/schema';

import { DEFAULT_TEAM_USER_NAME } from './constants';
import { calculateDailyLimit, type DifficultyLevel } from './difficulty';
import { generateLocalId } from './ids';
import { generateInviteCode, normalizeInviteCode } from './inviteCodes';
import { mirrorTeamAndMember } from '../sync/teamMirror';

export interface TeamFlowResult {
  team: Team | null;
  member: TeamMember | null;
  alreadyMember: boolean;
  error: Error | null;
}

export interface CreateTeamInput {
  name: string;
  difficultyLevel: DifficultyLevel;
  durationDays: number;
  dailyCigarettes: number;
  userName?: string;
}

function generateUniqueInviteCode(): string {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const code = generateInviteCode();
    if (getTeamByInviteCode(code) === null) {
      return code;
    }
  }
  throw new Error('No se pudo generar un código de invitación único');
}

export function createTeamWithLeader(input: CreateTeamInput): TeamFlowResult {
  try {
    const now = Date.now();
    const timestamp = new Date(now).toISOString();
    const userName = input.userName?.trim() || DEFAULT_TEAM_USER_NAME;
    const teamId = generateLocalId('team');
    const memberId = generateLocalId('member');

    const team: Team = {
      id: teamId,
      name: input.name.trim(),
      inviteCode: generateUniqueInviteCode(),
      difficultyLevel: input.difficultyLevel,
      durationDays: input.durationDays,
      createdAt: timestamp,
    };
    const member: TeamMember = {
      id: memberId,
      teamId,
      userName,
      dailyLimit: calculateDailyLimit(input.dailyCigarettes, input.difficultyLevel),
      role: 'leader',
      joinedAt: timestamp,
      postponedCount: 0,
      smokedToday: 0,
      streakDays: 0,
      hadStumble: 0,
    };

    db.transaction((transaction) => {
      transaction.insert(teams).values(team).run();
      transaction.insert(teamMembers).values(member).run();
    });

    void mirrorTeamAndMember(team, member);

    return { team, member, alreadyMember: false, error: null };
  } catch (caught) {
    return {
      team: null,
      member: null,
      alreadyMember: false,
      error: caught instanceof Error ? caught : new Error('No se pudo crear el equipo'),
    };
  }
}

export interface JoinTeamInput {
  inviteCode: string;
  dailyCigarettes: number;
  userName?: string;
}

export function joinTeamByInviteCode(input: JoinTeamInput): TeamFlowResult {
  try {
    const code = normalizeInviteCode(input.inviteCode);
    const team = getTeamByInviteCode(code);
    if (team === null) {
      return {
        team: null,
        member: null,
        alreadyMember: false,
        error: new Error(
          'No encontramos ese código en este dispositivo. Los equipos solo existen localmente.',
        ),
      };
    }

    const userName = input.userName?.trim() || DEFAULT_TEAM_USER_NAME;
    const existing = findTeamMember(team.id, userName);
    if (existing !== null) {
      void mirrorTeamAndMember(team, existing);
      return {
        team,
        member: existing,
        alreadyMember: true,
        error: null,
      };
    }

    const timestamp = new Date().toISOString();
    const member: TeamMember = {
      id: generateLocalId('member'),
      teamId: team.id,
      userName,
      dailyLimit: calculateDailyLimit(input.dailyCigarettes, team.difficultyLevel as DifficultyLevel),
      role: 'member',
      joinedAt: timestamp,
      postponedCount: 0,
      smokedToday: 0,
      streakDays: 0,
      hadStumble: 0,
    };

    db.insert(teamMembers).values(member).run();
    void mirrorTeamAndMember(team, member);

    return { team, member, alreadyMember: false, error: null };
  } catch (caught) {
    return {
      team: null,
      member: null,
      alreadyMember: false,
      error: caught instanceof Error ? caught : new Error('No se pudo unir al equipo'),
    };
  }
}
