import type { ReactElement } from 'react';

import { Text, View } from 'react-native';

export interface PlaceholderScreenProps {
  title: string;
  subtitle: string;
}

export function PlaceholderScreen({ title, subtitle }: PlaceholderScreenProps): ReactElement {
  return (
    <View className="flex-1 items-center justify-center bg-background px-5">
      <Text className="text-2xl font-bold text-text-primary">{title}</Text>
      <Text className="mt-2 text-center text-text-secondary">{subtitle}</Text>
    </View>
  );
}
