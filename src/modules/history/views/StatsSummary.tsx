import type { ReactElement } from 'react';

import { Text, View } from 'react-native';

import { formatMoney } from '@/shared/utils/utils';

import type { HistorySummary, PauseAnalytics } from '../utils/analytics';
import { SUCCESS_EMPTY_LABEL } from '../utils/constants';

export interface StatsSummaryProps {
  analytics: PauseAnalytics;
  summary: HistorySummary;
}

function formatCigarettes(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) {
    return '0';
  }
  return amount.toFixed(1).replace(/\.0$/, '');
}

export function StatsSummary({ analytics, summary }: StatsSummaryProps): ReactElement {
  const successLabel =
    analytics.total === 0 ? SUCCESS_EMPTY_LABEL : `${Math.round(analytics.successRate)}%`;
  const streakLabel = `${analytics.streakDays}d ${analytics.streakHours}h`;

  return (
    <View className="mt-5">
      <View className="flex-row gap-3">
        <View className="flex-1 rounded-2xl border border-border-card bg-card p-4">
          <Text className="text-xs uppercase text-text-secondary">Tasa de éxito</Text>
          <Text className="mt-1 text-3xl font-black text-brand-amber">{successLabel}</Text>
          <Text className="mt-1 text-xs text-text-secondary">
            {analytics.resisted} de {analytics.total} pausas
          </Text>
        </View>
        <View className="flex-1 rounded-2xl border border-border-card bg-card p-4">
          <Text className="text-xs uppercase text-text-secondary">Racha activa</Text>
          <Text className="mt-1 text-3xl font-black text-text-primary">{streakLabel}</Text>
          <Text className="mt-1 text-xs text-text-secondary">Sin fumar</Text>
        </View>
      </View>

      <View className="mt-3 rounded-2xl border border-border-card bg-card p-4">
        <Text className="text-xs uppercase text-text-secondary">Cigarrillos evitados</Text>
        <Text className="mt-1 text-2xl font-black text-brand-amber">
          {formatCigarettes(summary.avoidedCigarettes)}
        </Text>
      </View>

      <View className="mt-3 flex-row gap-3">
        <View className="flex-1 rounded-2xl border border-border-card bg-card p-4">
          <Text className="text-xs uppercase text-text-secondary">Ahorrado</Text>
          <Text className="mt-1 text-xl font-black text-brand-amber">
            {formatMoney(summary.moneySaved, summary.currency)}
          </Text>
        </View>
        <View className="flex-1 rounded-2xl border border-border-card bg-card p-4">
          <Text className="text-xs uppercase text-text-secondary">Gastado en inventario</Text>
          <Text className="mt-1 text-xl font-black text-text-primary">
            {formatMoney(summary.inventorySpending, summary.currency)}
          </Text>
        </View>
      </View>
    </View>
  );
}
