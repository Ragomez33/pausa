import type { ReactElement } from 'react';

import { Redirect, useRouter } from 'expo-router';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

import { useHomeMetrics } from '../hooks/useHomeMetrics';
import { formatMoney } from '../utils/metrics';

export function DashboardScreen(): ReactElement {
  const router = useRouter();
  const { loading, hasProfile, metrics, error } = useHomeMetrics();

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

  if (!hasProfile || metrics === null) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <View className="flex-1 bg-slate-900 px-6 pt-16">
      <Text className="text-2xl font-bold text-slate-100">Tu progreso</Text>

      <View className="mt-6 flex-row gap-3">
        <View className="flex-1 rounded-2xl bg-slate-800 p-4">
          <Text className="text-xs uppercase text-slate-400">Ahorrado</Text>
          <Text className="mt-1 text-xl font-bold text-emerald-400">
            {formatMoney(metrics.moneySaved, metrics.currency)}
          </Text>
        </View>
        <View className="flex-1 rounded-2xl bg-slate-800 p-4">
          <Text className="text-xs uppercase text-slate-400">Racha</Text>
          <Text className="mt-1 text-xl font-bold text-slate-100">{metrics.currentStreak}</Text>
        </View>
      </View>

      <View className="mt-3 rounded-2xl bg-slate-800 p-4">
        <Text className="text-xs uppercase text-slate-400">Pausas logradas</Text>
        <Text className="mt-1 text-xl font-bold text-slate-100">{metrics.resistedCount}</Text>
      </View>

      <View className="flex-1 items-center justify-center">
        <TouchableOpacity
          onPress={() => router.push('/pause')}
          className="h-52 w-52 items-center justify-center rounded-full bg-emerald-500 active:bg-emerald-400"
        >
          <Text className="text-3xl font-black text-slate-900">Pausa</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
