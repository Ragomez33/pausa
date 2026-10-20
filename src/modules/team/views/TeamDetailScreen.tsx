import type { ReactElement } from 'react';

import { Text, View } from 'react-native';

import { SectionHeader } from '@/shared/components/SectionHeader';

export interface TeamDetailScreenProps {
  teamId: string;
}

export function TeamDetailScreen({ teamId }: TeamDetailScreenProps): ReactElement {
  return (
    <View className="flex-1 bg-background px-6 pt-12">
      <SectionHeader title="Detalle de equipo" subtitle="Equipo" />

      <View className="mt-6 rounded-2xl border border-border-card bg-card p-5">
        <Text className="text-sm font-semibold text-text-secondary">Equipo {teamId}</Text>
        <Text className="mt-2 text-base text-text-primary">Métricas y miembros.</Text>
      </View>
    </View>
  );
}
