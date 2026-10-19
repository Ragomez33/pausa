import type { ReactElement } from 'react';

import { Redirect, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

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
  const router = useRouter();
  const { loading, hasProfile, statuses, unlockedCount, error } = useBadges();

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

  if (!hasProfile || statuses.length === 0) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <ScrollView contentContainerClassName="bg-slate-900 px-6 py-12">
      <TouchableOpacity onPress={() => router.back()} className="self-start py-2">
        <Text className="text-sm font-semibold text-emerald-400">Volver</Text>
      </TouchableOpacity>

      <Text className="mt-4 text-2xl font-bold text-slate-100">Logros</Text>
      <Text className="mt-2 text-sm text-slate-400">
        Cada pausa y cada día sin fumar suman. Sigue avanzando.
      </Text>

      <View className="mt-5 rounded-2xl bg-slate-800 p-4">
        <Text className="text-xs uppercase text-slate-400">Desbloqueados</Text>
        <Text className="mt-1 text-3xl font-black text-emerald-400">
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
                  ? 'border-emerald-500/40 bg-emerald-500/10'
                  : 'border-slate-800 bg-slate-800/60'
              }`}
            >
              <View className="flex-row items-start justify-between gap-3">
                <View className="flex-1">
                  <Text
                    className={`text-base font-bold ${
                      status.unlocked ? 'text-emerald-300' : 'text-slate-300'
                    }`}
                  >
                    {definition.title}
                  </Text>
                  <Text className="mt-1 text-sm text-slate-400">{definition.description}</Text>
                </View>
                <Text className={status.unlocked ? 'text-2xl text-emerald-400' : 'text-2xl text-slate-600'}>
                  {status.unlocked ? '★' : '☆'}
                </Text>
              </View>

              {status.unlocked ? (
                status.unlockedAt !== undefined ? (
                  <Text className="mt-3 text-xs text-emerald-400/80">
                    Desbloqueado el {formatDateTime(status.unlockedAt)}
                  </Text>
                ) : null
              ) : (
                <View className="mt-3">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-xs text-slate-500">
                      {formatProgressValue(status.progressValue)} / {definition.target}{' '}
                      {definition.unit}
                    </Text>
                    <Text className="text-xs text-slate-500">
                      {Math.round(status.progressPercent)}%
                    </Text>
                  </View>
                  <View className="mt-2 h-2 overflow-hidden rounded-full bg-slate-700">
                    <View
                      className="h-2 rounded-full bg-emerald-500/70"
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
  );
}
