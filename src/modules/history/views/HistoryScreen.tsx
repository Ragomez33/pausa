import type { ReactElement } from 'react';
import { memo, useMemo } from 'react';

import { Redirect, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

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
    <View className="mt-3 rounded-2xl bg-slate-800 p-4">
      <View className="flex-row items-start justify-between gap-3">
        <Text className="flex-1 text-xs text-slate-400">{entry.dateTimeLabel}</Text>
        <View
          className={`rounded-full px-3 py-1 ${
            entry.resisted ? 'bg-emerald-500/20' : 'bg-amber-500/20'
          }`}
        >
          <Text
            className={`text-xs font-semibold ${
              entry.resisted ? 'text-emerald-300' : 'text-amber-300'
            }`}
          >
            {entry.outcomeLabel}
          </Text>
        </View>
      </View>
      <Text className="mt-2 text-base font-semibold text-slate-100">{entry.triggerLabel}</Text>
      {entry.notes !== null ? (
        <Text className="mt-1 text-sm text-slate-400">{entry.notes}</Text>
      ) : null}
    </View>
  );
});

export function HistoryScreen(): ReactElement {
  const router = useRouter();
  const { loading, hasProfile, events, analytics, error } = useHistory();
  const entries = useMemo(() => events.map(toHistoryEntry), [events]);

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

  if (!hasProfile || analytics === null) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <View className="flex-1 bg-slate-900">
      <FlatList
        data={entries}
        keyExtractor={(item) => String(item.id)}
        contentContainerClassName="px-6 pb-10"
        initialNumToRender={12}
        windowSize={7}
        removeClippedSubviews
        ListHeaderComponent={
          <View>
            <TouchableOpacity onPress={() => router.back()} className="mt-12 self-start py-2">
              <Text className="text-sm font-semibold text-emerald-400">Volver</Text>
            </TouchableOpacity>
            <Text className="mt-4 text-2xl font-bold text-slate-100">Historial</Text>
            <Text className="mt-2 text-sm text-slate-400">
              Revisa tus pausas y descubre qué las dispara.
            </Text>
            <StatsSummary analytics={analytics} />
            <TriggerBreakdown triggers={analytics.triggers} />
            <Text className="mt-6 text-xs uppercase text-slate-500">Pausas registradas</Text>
          </View>
        }
        renderItem={({ item }) => <HistoryRow entry={item} />}
        ListEmptyComponent={
          <View className="mt-6 rounded-2xl bg-slate-800 p-5">
            <Text className="text-center text-sm text-slate-400">{HISTORY_EMPTY_MESSAGE}</Text>
          </View>
        }
      />
    </View>
  );
}
