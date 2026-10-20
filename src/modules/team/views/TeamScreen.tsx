import type { ReactElement } from 'react';

import { Redirect, useRouter } from 'expo-router';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { MainTabBar } from '@/shared/components/MainTabBar';
import { THEME_COLORS } from '@/shared/constants/theme';
import { formatMoney } from '@/shared/utils/utils';

import { useTeamDashboard } from '../hooks/useTeamDashboard';
import { REALTIME_STATUS_LABELS, SYNC_STATUS_LABELS } from '../utils/constants';
import { getDifficultyLabel, type DifficultyLevel } from '../utils/difficulty';
import { Leaderboard } from './Leaderboard';

export function TeamScreen(): ReactElement {
  const router = useRouter();
  const {
    loading,
    hasProfile,
    team,
    members,
    summary,
    leaderboard,
    currency,
    syncStatus,
    pendingCount,
    realtimeStatus,
    error,
  } = useTeamDashboard();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color={THEME_COLORS.brandOrange} />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <Text className="text-center text-accent-strong">{error.message}</Text>
      </View>
    );
  }

  if (!hasProfile) {
    return <Redirect href="/onboarding" />;
  }

  if (team === null || summary === null || leaderboard === null) {
    return (
      <View className="flex-1 bg-background">
        <View className="px-5 pt-12">
          <MainTabBar />
        </View>
        <ScrollView contentContainerClassName="flex-grow px-6 pt-5 pb-12">
          <Text className="text-2xl font-black text-text-primary">Equipo</Text>
          <Text className="mt-2 text-sm text-text-secondary">
            Crea un escuadrón o únete con un código para empezar un reto por niveles.
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/team/create')}
            className="mt-8 items-center rounded-2xl bg-brand-orange py-5 active:bg-accent-pressed"
          >
            <Text className="text-base font-bold text-white">Crear equipo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/team/join')}
            className="mt-3 items-center rounded-2xl border border-border-card bg-card py-5 active:bg-card/70"
          >
            <Text className="text-base font-bold text-text-secondary">Unirme con código</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  const { team: activeTeam } = summary;

  return (
    <View className="flex-1 bg-background">
      <View className="px-5 pt-12">
        <MainTabBar />
      </View>

      <ScrollView contentContainerClassName="px-6 pt-5 pb-12">
        <Text className="text-2xl font-black text-text-primary">Equipo</Text>

        <View className="mt-4 rounded-3xl border border-border-card bg-card p-5">
        <Text className="text-2xl font-black text-text-primary">{activeTeam.name}</Text>
        <Text className="mt-1 text-sm text-text-secondary">
          {getDifficultyLabel(activeTeam.difficultyLevel as DifficultyLevel)} ·{' '}
          {activeTeam.durationDays} días
        </Text>
        <View className="mt-4 flex-row gap-3">
          <View className="flex-1 rounded-xl bg-background p-3">
            <Text className="text-xs uppercase text-text-secondary">Código</Text>
            <Text className="mt-1 text-lg font-black tracking-widest text-accent-strong">
              {activeTeam.inviteCode}
            </Text>
          </View>
          <View className="flex-1 rounded-xl bg-background p-3">
            <Text className="text-xs uppercase text-text-secondary">Restan</Text>
            <Text className="mt-1 text-lg font-black text-text-primary">
              {summary.expired ? 'Finalizado' : `${summary.remainingDays} días`}
            </Text>
          </View>
        </View>
        <Text className="mt-3 text-xs text-text-secondary">{members.length} integrantes</Text>
      </View>

      <View className="mt-4 rounded-xl border border-border-card bg-card px-4 py-3">
        <Text className="text-sm font-semibold text-text-primary">
          {SYNC_STATUS_LABELS[syncStatus] ?? syncStatus}
        </Text>
        <Text className="mt-1 text-xs text-text-secondary">
          {pendingCount > 0
            ? `${pendingCount} evento(s) pendientes`
            : REALTIME_STATUS_LABELS[realtimeStatus] ?? realtimeStatus}
        </Text>
      </View>

      <View className="mt-4 flex-row gap-3">
        <View className="flex-1 rounded-2xl border border-border-card bg-card p-4">
          <Text className="text-xs uppercase text-text-secondary">Posposiciones</Text>
          <Text className="mt-1 text-2xl font-black text-brand-amber">
            {summary.collectivePostponed}
          </Text>
        </View>
        <View className="flex-1 rounded-2xl border border-border-card bg-card p-4">
          <Text className="text-xs uppercase text-text-secondary">Cigarrillos evitados</Text>
          <Text className="mt-1 text-2xl font-black text-text-primary">
            {summary.avoidedCigarettes}
          </Text>
        </View>
      </View>
      <View className="mt-3 rounded-2xl border border-border-card bg-card p-4">
        <Text className="text-xs uppercase text-text-secondary">Dinero ahorrado grupal</Text>
        <Text className="mt-1 text-2xl font-black text-brand-amber">
          {formatMoney(summary.moneySaved, currency)}
        </Text>
      </View>

      <Text className="mt-6 text-xs uppercase text-text-secondary">Integrantes</Text>
      <View className="mt-3 gap-3">
        {members.map((member) => (
          <View
            key={member.id}
            className="rounded-2xl border border-border-card bg-card p-4"
          >
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-bold text-text-primary">{member.userName}</Text>
              <Text className="text-xs font-semibold uppercase text-text-secondary">
                {member.role === 'leader' ? 'Líder' : 'Miembro'}
              </Text>
            </View>
            <View className="mt-2 flex-row items-center justify-between">
              <Text className="text-sm text-text-secondary">Hoy</Text>
              <Text className="text-sm font-semibold text-text-primary">
                {member.smokedToday} / {member.dailyLimit}
              </Text>
            </View>
            <View className="mt-2 h-2 overflow-hidden rounded-full bg-border-card">
              <View
                className="h-2 rounded-full bg-brand-amber"
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
          className="flex-1 items-center rounded-xl border border-border-card bg-card py-3 active:bg-card/70"
        >
          <Text className="text-sm font-semibold text-accent-strong">Crear otro</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push('/team/join')}
          className="flex-1 items-center rounded-xl border border-border-card bg-card py-3 active:bg-card/70"
        >
          <Text className="text-sm font-semibold text-accent-strong">Unirme a otro</Text>
        </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
