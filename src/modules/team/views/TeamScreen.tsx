import type { ReactElement } from 'react';
import { useCallback, useState } from 'react';

import { useFocusEffect } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';

import { listTeams } from '@/db/queries';
import type { Team } from '@/db/schema';

import { GOAL_LEVEL_LABELS, TEAM_RANKS } from '../utils/constants';

export function TeamScreen(): ReactElement {
  const [teams, setTeams] = useState<Team[]>([]);

  useFocusEffect(
    useCallback(() => {
      try {
        setTeams(listTeams());
      } catch {
        setTeams([]);
      }
    }, []),
  );

  return (
    <ScrollView contentContainerClassName="bg-slate-900 px-6 py-12">
      <Text className="text-2xl font-bold text-slate-100">Equipo</Text>
      <Text className="mt-2 text-sm text-slate-400">
        Retos locales y rangos del equipo. La sincronización llegará más adelante.
      </Text>

      <View className="mt-5 rounded-2xl bg-slate-800 p-4">
        <Text className="text-xs uppercase text-slate-400">Equipos</Text>
        <Text className="mt-1 text-xl font-bold text-slate-100">{teams.length}</Text>
        {teams.length === 0 ? (
          <Text className="mt-2 text-sm text-slate-500">
            Todavía no hay equipos creados en este dispositivo.
          </Text>
        ) : (
          <View className="mt-3 gap-2">
            {teams.map((team) => (
              <View key={team.id} className="rounded-xl bg-slate-900 px-3 py-2">
                <Text className="text-sm font-semibold text-slate-200">{team.name}</Text>
                <Text className="text-xs text-slate-500">
                  {GOAL_LEVEL_LABELS[team.goalLevel] ?? team.goalLevel} · {team.durationDays} días
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <Text className="mt-6 text-xs uppercase text-slate-500">Ranking del equipo</Text>
      <View className="mt-3 gap-3">
        {TEAM_RANKS.map((rank) => (
          <View key={rank.name} className="rounded-2xl bg-slate-800 p-4">
            <Text className="text-base font-bold text-emerald-400">{rank.name}</Text>
            <Text className="mt-1 text-sm text-slate-400">{rank.description}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
