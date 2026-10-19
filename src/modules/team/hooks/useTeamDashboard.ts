import { useCallback, useState } from 'react';

import { useFocusEffect } from 'expo-router';

import {
  countSmokingEventsBetween,
  getActiveTeam,
  getLatestCededTimestamp,
  getProfile,
  listTeamMembers,
  updateTeamMemberProgress,
} from '@/db/queries';
import type { Team, TeamMember } from '@/db/schema';
import { getLocalDayRange } from '@/shared/utils/dayRange';
import { DAY_MS, computeElapsedMs, resolveStreakStartMs } from '@/shared/utils/derivedMetrics';

import type { TeamLeaderboard } from '../utils/leaderboard';
import { buildLeaderboard } from '../utils/leaderboard';
import { DEFAULT_TEAM_USER_NAME } from '../utils/service';
import type { TeamSummary } from '../utils/summary';
import { buildTeamSummary } from '../utils/summary';

interface TeamDashboardState {
  loading: boolean;
  hasProfile: boolean;
  team: Team | null;
  members: TeamMember[];
  summary: TeamSummary | null;
  leaderboard: TeamLeaderboard | null;
  currency: string;
  error: Error | null;
}

export interface UseTeamDashboardResult extends TeamDashboardState {
  refresh: () => void;
}

export function useTeamDashboard(): UseTeamDashboardResult {
  const [state, setState] = useState<TeamDashboardState>({
    loading: true,
    hasProfile: false,
    team: null,
    members: [],
    summary: null,
    leaderboard: null,
    currency: 'USD',
    error: null,
  });

  const load = useCallback((): void => {
    try {
      const profile = getProfile();
      if (profile === null) {
        setState({
          loading: false,
          hasProfile: false,
          team: null,
          members: [],
          summary: null,
          leaderboard: null,
          currency: 'USD',
          error: null,
        });
        return;
      }

      const team = getActiveTeam();
      if (team === null) {
        setState({
          loading: false,
          hasProfile: true,
          team: null,
          members: [],
          summary: null,
          leaderboard: null,
          currency: profile.currency,
          error: null,
        });
        return;
      }

      let members = listTeamMembers(team.id);
      const localMember = members.find((member) => member.userName === DEFAULT_TEAM_USER_NAME);
      if (localMember !== undefined) {
        const now = Date.now();
        const dayRange = getLocalDayRange(now);
        const smokedToday = countSmokingEventsBetween(dayRange.startIso, dayRange.endIso);
        const streakStart = resolveStreakStartMs(
          profile.createdAt,
          getLatestCededTimestamp(),
        );
        const streakDays = Math.floor(
          computeElapsedMs(streakStart, now) / DAY_MS,
        );
        const hadStumble =
          smokedToday > 0 && smokedToday <= localMember.dailyLimit ? 1 : localMember.hadStumble;

        updateTeamMemberProgress(localMember.id, {
          postponedCount: profile.postponedCount,
          smokedToday,
          streakDays,
          hadStumble: hadStumble === 1,
        });
        members = listTeamMembers(team.id);
      }

      setState({
        loading: false,
        hasProfile: true,
        team,
        members,
        summary: buildTeamSummary(team, members, profile.packCost, Date.now()),
        leaderboard: buildLeaderboard(members),
        currency: profile.currency,
        error: null,
      });
    } catch (caught) {
      setState({
        loading: false,
        hasProfile: false,
        team: null,
        members: [],
        summary: null,
        leaderboard: null,
        currency: 'USD',
        error: caught instanceof Error ? caught : new Error('Error de base de datos'),
      });
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return { ...state, refresh: load };
}
