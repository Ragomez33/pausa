import type { ReactElement } from 'react';

import { Redirect } from 'expo-router';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';

import { MainTabBar } from '@/shared/components/MainTabBar';
import { THEME_COLORS } from '@/shared/constants/theme';
import { formatDateTime } from '@/shared/utils/utils';

import { useBadges } from '../hooks/useBadges';
import { BADGE_CATALOG } from '../utils/catalog';

function formatProgressValue(value: number): string {
  if (Number.isInteger(value)) {
    return String(value);
  }
  return value.toFixed(1);
}

export function BadgesScreen(): ReactElement {
  const { loading, hasProfile, statuses, unlockedCount, error } = useBadges();

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

  if (!hasProfile || statuses.length === 0) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <View className="flex-1 bg-background">
      <View className="px-5 pt-12">
        <MainTabBar />
      </View>

      <ScrollView contentContainerClassName="px-6 pt-5 pb-12">
        <Text className="text-2xl font-bold text-text-primary">Logros</Text>
        <Text className="mt-2 text-sm text-text-secondary">
          Cada pausa y cada día sin fumar suman. Sigue avanzando.
        </Text>

      <View className="mt-5 rounded-2xl border border-border-card bg-card p-4">
        <Text className="text-xs uppercase text-text-secondary">Desbloqueados</Text>
        <Text className="mt-1 text-3xl font-black text-brand-amber">
          {unlockedCount} / {BADGE_CATALOG.length}
        </Text>
      </View>

      <View className="mt-4 gap-3">
        {statuses.map((status) => {
          const { definition } = status;
          return (
            <View
              key={definition.key}
              className={`rounded-2xl border p-4 ${
                status.unlocked
                  ? 'border-brand-amber/40 bg-brand-amber/10'
                  : 'border-border-card bg-card/60'
              }`}
            >
              <View className="flex-row items-start justify-between gap-3">
                <View className="flex-1">
                  <Text
                    className={`text-base font-bold ${
                      status.unlocked ? 'text-brand-amber' : 'text-text-primary'
                    }`}
                  >
                    {definition.title}
                  </Text>
                  <Text className="mt-1 text-sm text-text-secondary">{definition.description}</Text>
                </View>
                <Text className={status.unlocked ? 'text-2xl text-brand-amber' : 'text-2xl text-text-secondary/50'}>
                  {status.unlocked ? '★' : '☆'}
                </Text>
              </View>

              {status.unlocked ? (
                status.unlockedAt !== undefined ? (
                  <Text className="mt-3 text-xs text-brand-amber/80">
                    Desbloqueado el {formatDateTime(status.unlockedAt)}
                  </Text>
                ) : null
              ) : (
                <View className="mt-3">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-xs text-text-secondary">
                      {formatProgressValue(status.progressValue)} / {definition.target}{' '}
                      {definition.unit}
                    </Text>
                    <Text className="text-xs text-text-secondary">
                      {Math.round(status.progressPercent)}%
                    </Text>
                  </View>
                  <View className="mt-2 h-2 overflow-hidden rounded-full bg-border-card">
                    <View
                      className="h-2 rounded-full bg-brand-amber/70"
                      style={{ width: `${status.progressPercent}%` }}
                    />
                  </View>
                </View>
              )}
            </View>
          );
        })}
        </View>
      </ScrollView>
    </View>
  );
}
