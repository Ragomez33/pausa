import type { ReactElement } from 'react';

import { Text, View } from 'react-native';

import type { TeamLeaderboard } from '../utils/leaderboard';
import { TEAM_RANKS } from '../utils/constants';

export interface LeaderboardProps {
  leaderboard: TeamLeaderboard;
}

export function Leaderboard({ leaderboard }: LeaderboardProps): ReactElement {
  const winners = [
    leaderboard.guardian,
    leaderboard.unbreakable,
    leaderboard.resilient,
  ];

  return (
    <View className="mt-6">
      <Text className="text-xs uppercase text-slate-500">Distinciones del equipo</Text>
      <View className="mt-3 gap-3">
        {TEAM_RANKS.map((rank, index) => {
          const winner = winners[index];
          return (
            <View key={rank.name} className="rounded-2xl bg-slate-800 p-4">
              <Text className="text-base font-bold text-emerald-400">{rank.name}</Text>
              <Text className="mt-1 text-sm text-slate-400">{rank.description}</Text>
              <Text className="mt-2 text-sm font-semibold text-slate-200">
                {winner !== null ? winner.userName : 'Sin ganador todavía'}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
