import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';

import { Redirect, useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { Cigarette } from '@/shared/components/icons';
import { MainTabBar } from '@/shared/components/MainTabBar';
import { THEME_COLORS } from '@/shared/constants/theme';

import { formatElapsedDuration } from '@/shared/utils/utils';

import { useBadgeEvaluation } from '@/modules/badges/hooks/useBadgeEvaluation';
import { usePersonalSyncSnapshot } from '@/shared/hooks/usePersonalSync';

import { useHomeMetrics } from '../hooks/useHomeMetrics';
import { getFeedbackMessage } from '../utils/feedback';

// NativeWind cannot express colored glow shadows consistently across platforms,
// so the few neon/elevation values are applied through the `style` prop.
const CARD_SHADOW = {
  shadowColor: THEME_COLORS.textPrimary,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.12,
  shadowRadius: 10,
  elevation: 3,
} as const;

const PANIC_GLOW = {
  shadowColor: THEME_COLORS.brandOrange,
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.3,
  shadowRadius: 22,
  elevation: 10,
} as const;

export function DashboardScreen(): ReactElement {
  const router = useRouter();
  const params = useLocalSearchParams<{ feedback?: string }>();
  const feedbackParam = typeof params.feedback === 'string' ? params.feedback : undefined;
  const [banner, setBanner] = useState<string | null>(null);
  const { loading, hasProfile, metrics, error } = useHomeMetrics();
  const personalSync = usePersonalSyncSnapshot();
  useBadgeEvaluation();

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

  if (!hasProfile || metrics === null) {
    return <Redirect href="/onboarding" />;
  }

  const pauseLabel = metrics.resistedCount === 1 ? 'Pausa' : 'Pausas';
  const smokedLabel = metrics.cededCount === 1 ? 'Fumado' : 'Fumados';

  return (
    <View className="flex-1 bg-background px-5 pt-12 pb-8">
      <MainTabBar />

      {banner !== null ? (
        <View className="mt-4 flex-row items-center rounded-2xl border border-brand-amber/30 bg-brand-amber/10 px-4 py-3">
          <Text className="flex-1 text-sm font-medium text-text-primary">{banner}</Text>
          <TouchableOpacity onPress={() => setBanner(null)} className="ml-3 py-1">
            <Text className="text-[10px] font-black uppercase tracking-widest text-brand-amber">
              Cerrar
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <TouchableOpacity
        onPress={() => router.push('/account' as Href)}
        activeOpacity={0.82}
        className="mt-4 flex-row items-center justify-between rounded-2xl border border-border-card bg-card px-4 py-3"
      >
        <View>
          <Text className="text-[10px] font-black uppercase tracking-[0.18em] text-text-secondary">
            Respaldo personal
          </Text>
          <Text className="mt-0.5 text-xs font-semibold text-text-primary">
            {personalSync.status === 'disabled'
              ? 'Solo en este dispositivo'
              : personalSync.status === 'synced'
                ? 'Sincronizado'
                : personalSync.status === 'syncing'
                  ? 'Sincronizando'
                  : personalSync.status === 'offline'
                    ? 'Sin conexión'
                    : personalSync.status === 'error'
                      ? 'Revisar respaldo'
                      : `${personalSync.pendingCount} pendientes`}
          </Text>
        </View>
        <Text className="text-xs font-bold text-accent-strong">Cuenta</Text>
      </TouchableOpacity>

      <View className="mt-5 flex-row gap-3">
        <View
          className="flex-1 rounded-3xl border border-border-card bg-card p-5"
          style={CARD_SHADOW}
        >          <Text className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-secondary">
            Racha actual
          </Text>
          <Text className="mt-2 text-3xl font-black tracking-tight text-text-primary">
            {formatElapsedDuration(metrics.elapsedMs)}
          </Text>
          <Text className="mt-1 text-xs text-text-secondary">Sin fumar</Text>
        </View>

        <View
          className="flex-1 rounded-3xl border border-border-card bg-card p-5"
          style={CARD_SHADOW}
        >
          <Text className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-secondary">
            Hoy
          </Text>
          <View className="mt-3 flex-row items-baseline gap-1">
            <Text className="text-2xl font-black text-text-primary">
              {metrics.resistedCount}
            </Text>
            <Text className="text-[10px] font-bold uppercase text-text-secondary">
              {pauseLabel}
            </Text>
            <Text className="mx-1 text-sm font-bold text-border-card">|</Text>
            <Text className="text-2xl font-black text-accent-strong">
              {metrics.cededCount}
            </Text>
            <Text className="text-[10px] font-bold uppercase text-text-secondary">
              {smokedLabel}
            </Text>
          </View>
          <Text className="mt-1 text-xs text-text-secondary">Pausas vs. cesiones</Text>
        </View>
      </View>

      <View className="flex-1 items-center justify-center py-6">
        <TouchableOpacity
          onPress={() => router.push('/pause')}
          activeOpacity={0.86}
          className="h-60 w-60 items-center justify-center rounded-full border-4 border-white/40 bg-brand-orange active:bg-accent-pressed"
          style={PANIC_GLOW}
        >
          <Cigarette color={THEME_COLORS.white} size={52} strokeWidth={2.2} />
          <Text className="mt-4 text-xl font-bold text-white">Quiero fumar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
