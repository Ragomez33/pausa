import type { ReactElement } from 'react';

import { Text, View } from 'react-native';

import type { PauseAnalytics } from '../utils/analytics';
import { SUCCESS_EMPTY_LABEL } from '../utils/constants';

export interface StatsSummaryProps {
  analytics: PauseAnalytics;
}

export function StatsSummary({ analytics }: StatsSummaryProps): ReactElement {
  const successLabel =
    analytics.total === 0 ? SUCCESS_EMPTY_LABEL : `${Math.round(analytics.successRate)}%`;
  const streakLabel = `${analytics.streakDays}d ${analytics.streakHours}h`;

  return (
    <View className="mt-5 flex-row gap-3">
      <View className="flex-1 rounded-2xl bg-slate-800 p-4">
        <Text className="text-xs uppercase text-slate-400">Tasa de éxito</Text>
        <Text className="mt-1 text-3xl font-black text-emerald-400">{successLabel}</Text>
        <Text className="mt-1 text-xs text-slate-500">
          {analytics.resisted} de {analytics.total} pausas
        </Text>
      </View>
      <View className="flex-1 rounded-2xl bg-slate-800 p-4">
        <Text className="text-xs uppercase text-slate-400">Racha activa</Text>
        <Text className="mt-1 text-3xl font-black text-slate-100">{streakLabel}</Text>
        <Text className="mt-1 text-xs text-slate-500">Sin fumar</Text>
      </View>
    </View>
  );
}
