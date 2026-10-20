import type { ReactElement } from 'react';

import { Text, View } from 'react-native';

import type { TriggerBreakdown as TriggerBreakdownItem } from '../utils/analytics';
import { TRIGGER_EMPTY_MESSAGE } from '../utils/constants';

export interface TriggerBreakdownProps {
  triggers: TriggerBreakdownItem[];
}

export function TriggerBreakdown({ triggers }: TriggerBreakdownProps): ReactElement {
  const maxCount = triggers.reduce((maximum, item) => Math.max(maximum, item.count), 0);

  return (
    <View className="mt-5 rounded-2xl border border-border-card bg-card p-4">
      <Text className="text-xs uppercase text-text-secondary">Disparadores frecuentes</Text>

      {triggers.length === 0 ? (
        <Text className="mt-3 text-sm text-text-secondary">{TRIGGER_EMPTY_MESSAGE}</Text>
      ) : (
        <View className="mt-3 gap-4">
          {triggers.map((trigger) => {
            const width = maxCount > 0 ? (trigger.count / maxCount) * 100 : 0;
            return (
              <View key={trigger.triggerEmotion}>
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm font-semibold text-text-primary">
                    {trigger.label}
                  </Text>
                  <Text className="text-xs text-text-secondary">
                    {trigger.count} · {Math.round(trigger.percentage)}%
                  </Text>
                </View>
                <View className="mt-2 h-2 overflow-hidden rounded-full bg-border-card">
                  <View
                    className="h-2 rounded-full bg-brand-amber"
                    style={{ width: `${width}%` }}
                  />
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}
