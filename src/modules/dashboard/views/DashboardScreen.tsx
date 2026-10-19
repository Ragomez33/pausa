import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';

import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { formatElapsedDuration, formatMoney } from '@/shared/utils/utils';

import { useBadgeEvaluation } from '@/modules/badges/hooks/useBadgeEvaluation';
import { useInactivityReminders } from '@/shared/hooks/useInactivityReminders';

import { useHomeMetrics } from '../hooks/useHomeMetrics';
import { getFeedbackMessage } from '../utils/feedback';
import { formatCigarettes } from '../utils/metrics';

export function DashboardScreen(): ReactElement {
  const router = useRouter();
  const params = useLocalSearchParams<{ feedback?: string }>();
  const feedbackParam = typeof params.feedback === 'string' ? params.feedback : undefined;
  const [banner, setBanner] = useState<string | null>(null);
  const { loading, hasProfile, metrics, error } = useHomeMetrics();
  useBadgeEvaluation();
  useInactivityReminders();

  useEffect(() => {
    const message = getFeedbackMessage(feedbackParam);
    setBanner(message);
    if (message === null) {
      return undefined;
    }
    const timer = setTimeout(() => setBanner(null), 5_000);
    return () => clearTimeout(timer);
  }, [feedbackParam]);

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
    <ScrollView contentContainerClassName="flex-grow bg-slate-900 px-6 pt-16 pb-10">
      <View className="flex-row items-center justify-between gap-2">
        <Text className="flex-1 text-2xl font-bold text-slate-100">Tu progreso</Text>
        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={() => router.push('/history')}
            className="rounded-full bg-slate-800 px-3 py-2"
          >
            <Text className="text-sm font-semibold text-emerald-400">Historial</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/inventory')}
            className="rounded-full bg-slate-800 px-3 py-2"
          >
            <Text className="text-sm font-semibold text-emerald-400">Inventario</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/badges')}
            className="rounded-full bg-slate-800 px-3 py-2"
          >
            <Text className="text-sm font-semibold text-emerald-400">Logros</Text>
          </TouchableOpacity>
        </View>
      </View>

      {banner !== null ? (
        <View className="mt-4 flex-row items-center rounded-xl bg-emerald-500/15 px-4 py-3">
          <Text className="flex-1 text-sm font-medium text-emerald-300">{banner}</Text>
          <TouchableOpacity onPress={() => setBanner(null)} className="ml-3 py-1">
            <Text className="text-xs font-semibold uppercase text-emerald-400">Cerrar</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <View className="mt-6 rounded-2xl bg-slate-800 p-5">
        <Text className="text-xs uppercase text-slate-400">Sin fumar desde</Text>
        <Text className="mt-1 text-3xl font-black text-emerald-400">
          {formatElapsedDuration(metrics.elapsedMs)}
        </Text>
      </View>

      <View className="mt-3 flex-row gap-3">
        <View className="flex-1 rounded-2xl bg-slate-800 p-4">
          <Text className="text-xs uppercase text-slate-400">Cigarrillos evitados</Text>
          <Text className="mt-1 text-2xl font-bold text-slate-100">
            {formatCigarettes(metrics.avoidedCigarettes)}
          </Text>
        </View>
        <View className="flex-1 rounded-2xl bg-slate-800 p-4">
          <Text className="text-xs uppercase text-slate-400">Ahorrado</Text>
          <Text className="mt-1 text-2xl font-bold text-emerald-400">
            {formatMoney(metrics.moneySaved, metrics.currency)}
          </Text>
        </View>
      </View>

      <View className="mt-3 flex-row gap-3">
        <View className="flex-1 rounded-2xl bg-slate-800 p-4">
          <Text className="text-xs uppercase text-slate-400">Pausas logradas</Text>
          <Text className="mt-1 text-2xl font-bold text-emerald-400">
            {metrics.resistedCount}
          </Text>
        </View>
        <View className="flex-1 rounded-2xl bg-slate-800 p-4">
          <Text className="text-xs uppercase text-slate-400">Cesiones</Text>
          <Text className="mt-1 text-2xl font-bold text-slate-300">{metrics.cededCount}</Text>
        </View>
      </View>

      <View className="mt-3 flex-row gap-3">
        <View className="flex-1 rounded-2xl bg-slate-800 p-4">
          <Text className="text-xs uppercase text-slate-400">Gastado en inventario</Text>
          <Text className="mt-1 text-xl font-bold text-slate-100">
            {formatMoney(metrics.inventorySpending, metrics.currency)}
          </Text>
        </View>
        <View className="flex-1 rounded-2xl bg-slate-800 p-4">
          <Text className="text-xs uppercase text-slate-400">Hoy</Text>
          <Text className="mt-1 text-xl font-bold text-slate-100">
            {metrics.smokedToday} / {metrics.dailyLimit > 0 ? metrics.dailyLimit : '—'}
          </Text>
        </View>
      </View>

      <View className="flex-1 items-center justify-center">
        <TouchableOpacity
          onPress={() => router.push('/pause')}
          className="h-52 w-52 items-center justify-center rounded-full bg-emerald-500 px-4 active:bg-emerald-400"
        >
          <Text className="text-center text-2xl font-black text-slate-900">Quiero fumar</Text>
          <Text className="mt-1 text-center text-xs font-semibold text-slate-800">
            Tengo ganas de fumar
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
