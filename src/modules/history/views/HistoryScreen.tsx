import type { ReactElement } from 'react';
import { memo, useMemo } from 'react';

import { Redirect } from 'expo-router';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';

import { MainTabBar } from '@/shared/components/MainTabBar';
import { THEME_COLORS } from '@/shared/constants/theme';

import { useHistory } from '../hooks/useHistory';
import { HISTORY_EMPTY_MESSAGE } from '../utils/constants';
import { toHistoryEntry, type HistoryEntry } from '../utils/mappers';
import { StatsSummary } from './StatsSummary';
import { TriggerBreakdown } from './TriggerBreakdown';

interface HistoryRowProps {
  entry: HistoryEntry;
}

const HistoryRow = memo(function HistoryRow({ entry }: HistoryRowProps): ReactElement {
  return (
    <View className="mt-3 rounded-2xl border border-border-card bg-card p-4">
      <View className="flex-row items-start justify-between gap-3">
        <Text className="flex-1 text-xs text-text-secondary">{entry.dateTimeLabel}</Text>
        <View
          className={`rounded-full px-3 py-1 ${
            entry.resisted ? 'bg-brand-amber/20' : 'bg-brand-orange/20'
          }`}
        >
          <Text
            className={`text-xs font-semibold ${
              entry.resisted ? 'text-brand-amber' : 'text-accent-strong'
            }`}
          >
            {entry.outcomeLabel}
          </Text>
        </View>
      </View>
      <Text className="mt-2 text-base font-semibold text-text-primary">{entry.triggerLabel}</Text>
      {entry.notes !== null ? (
        <Text className="mt-1 text-sm text-text-secondary">{entry.notes}</Text>
      ) : null}
    </View>
  );
});

export function HistoryScreen(): ReactElement {
  const { loading, hasProfile, events, analytics, summary, error } = useHistory();
  const entries = useMemo(() => events.map(toHistoryEntry), [events]);

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

  if (!hasProfile || analytics === null || summary === null) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <View className="flex-1 bg-background">
      <View className="px-5 pt-12">
        <MainTabBar />
      </View>
      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-6 pb-10"
        initialNumToRender={12}
        windowSize={7}
        removeClippedSubviews
        ListHeaderComponent={
          <View>
            <Text className="mt-5 text-2xl font-bold text-text-primary">Historial</Text>
            <Text className="mt-2 text-sm text-text-secondary">
              Revisa tus pausas y descubre qué las dispara.
            </Text>
            <StatsSummary analytics={analytics} summary={summary} />
            <TriggerBreakdown triggers={analytics.triggers} />
            <Text className="mt-6 text-xs uppercase text-text-secondary">
              Pausas y fumados registrados
            </Text>
          </View>
        }
        renderItem={({ item }) => <HistoryRow entry={item} />}
        ListEmptyComponent={
          <View className="mt-6 rounded-2xl border border-border-card bg-card p-5">
            <Text className="text-center text-sm text-text-secondary">{HISTORY_EMPTY_MESSAGE}</Text>
          </View>
        }
      />
    </View>
  );
}
