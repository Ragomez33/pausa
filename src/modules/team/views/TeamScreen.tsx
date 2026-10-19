import type { ReactElement } from 'react';

import { Redirect, useRouter } from 'expo-router';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { formatMoney } from '@/shared/utils/utils';

import { useTeamDashboard } from '../hooks/useTeamDashboard';
import { getDifficultyLabel, type DifficultyLevel } from '../utils/difficulty';
import { Leaderboard } from './Leaderboard';

export function TeamScreen(): ReactElement {
  const router = useRouter();
  const { loading, hasProfile, team, members, summary, leaderboard, currency, error } =
    useTeamDashboard();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-900">
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-900 px-6">
        <Text className="text-center text-red-400">{error.message}</Text>
      </View>
    );
  }

  if (!hasProfile) {
    return <Redirect href="/onboarding" />;
  }

  if (team === null || summary === null || leaderboard === null) {
    return (
      <ScrollView contentContainerClassName="flex-grow justify-center bg-slate-900 px-6 py-12">
        <Text className="text-center text-3xl font-black text-slate-100">Equipo</Text>
        <Text className="mt-3 text-center text-sm text-slate-400">
          Crea un escuadrón o únete con un código para empezar un reto por niveles.
        </Text>
        <TouchableOpacity
          onPress={() => router.push('/team/create')}
          className="mt-10 items-center rounded-2xl bg-emerald-500 py-5 active:bg-emerald-400"
        >
          <Text className="text-base font-bold text-slate-900">Crear equipo</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push('/team/join')}
          className="mt-3 items-center rounded-2xl border border-slate-600 py-5 active:bg-slate-800"
        >
          <Text className="text-base font-bold text-slate-300">Unirme con código</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  const { team: activeTeam } = summary;

  return (
    <ScrollView contentContainerClassName="bg-slate-900 px-6 py-12">
      <View className="rounded-3xl bg-slate-800 p-5">
        <Text className="text-2xl font-black text-slate-100">{activeTeam.name}</Text>
        <Text className="mt-1 text-sm text-slate-400">
          {getDifficultyLabel(activeTeam.difficultyLevel as DifficultyLevel)} ·{' '}
          {activeTeam.durationDays} días
        </Text>
        <View className="mt-4 flex-row gap-3">
          <View className="flex-1 rounded-xl bg-slate-900 p-3">
            <Text className="text-xs uppercase text-slate-500">Código</Text>
            <Text className="mt-1 text-lg font-black tracking-widest text-emerald-400">
              {activeTeam.inviteCode}
            </Text>
          </View>
          <View className="flex-1 rounded-xl bg-slate-900 p-3">
            <Text className="text-xs uppercase text-slate-500">Restan</Text>
            <Text className="mt-1 text-lg font-black text-slate-100">
              {summary.expired ? 'Finalizado' : `${summary.remainingDays} días`}
            </Text>
          </View>
        </View>
        <Text className="mt-3 text-xs text-slate-500">{members.length} integrantes</Text>
      </View>

      <View className="mt-4 flex-row gap-3">
        <View className="flex-1 rounded-2xl bg-slate-800 p-4">
          <Text className="text-xs uppercase text-slate-400">Posposiciones</Text>
          <Text className="mt-1 text-2xl font-black text-emerald-400">
            {summary.collectivePostponed}
          </Text>
        </View>
        <View className="flex-1 rounded-2xl bg-slate-800 p-4">
          <Text className="text-xs uppercase text-slate-400">Cigarrillos evitados</Text>
          <Text className="mt-1 text-2xl font-black text-slate-100">
            {summary.avoidedCigarettes}
          </Text>
        </View>
      </View>
      <View className="mt-3 rounded-2xl bg-slate-800 p-4">
        <Text className="text-xs uppercase text-slate-400">Dinero ahorrado grupal</Text>
        <Text className="mt-1 text-2xl font-black text-emerald-400">
          {formatMoney(summary.moneySaved, currency)}
        </Text>
      </View>

      <Text className="mt-6 text-xs uppercase text-slate-500">Integrantes</Text>
      <View className="mt-3 gap-3">
        {members.map((member) => (
          <View key={member.id} className="rounded-2xl bg-slate-800 p-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-bold text-slate-100">{member.userName}</Text>
              <Text className="text-xs font-semibold uppercase text-slate-500">
                {member.role === 'leader' ? 'Líder' : 'Miembro'}
              </Text>
            </View>
            <View className="mt-2 flex-row items-center justify-between">
              <Text className="text-sm text-slate-400">Hoy</Text>
              <Text className="text-sm font-semibold text-slate-200">
                {member.smokedToday} / {member.dailyLimit}
              </Text>
            </View>
            <View className="mt-2 h-2 overflow-hidden rounded-full bg-slate-700">
              <View
                className="h-2 rounded-full bg-emerald-500"
                style={{
                  width: `${
                    member.dailyLimit > 0
                      ? Math.min(100, (member.smokedToday / member.dailyLimit) * 100)
                      : member.smokedToday > 0
                        ? 100
                        : 0
                  }%`,
                }}
              />
            </View>
          </View>
        ))}
      </View>

      <Leaderboard leaderboard={leaderboard} />

      <View className="mt-6 flex-row gap-3">
        <TouchableOpacity
          onPress={() => router.push('/team/create')}
          className="flex-1 items-center rounded-xl bg-slate-800 py-3"
        >
          <Text className="text-sm font-semibold text-emerald-400">Crear otro</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push('/team/join')}
          className="flex-1 items-center rounded-xl bg-slate-800 py-3"
        >
          <Text className="text-sm font-semibold text-emerald-400">Unirme a otro</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
