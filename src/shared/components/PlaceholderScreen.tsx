import type { ReactElement } from 'react';

import { Text, View } from 'react-native';

export interface PlaceholderScreenProps {
  title: string;
  subtitle: string;
}

export function PlaceholderScreen({ title, subtitle }: PlaceholderScreenProps): ReactElement {
  return (
    <View className="flex-1 items-center justify-center px-5">
      <Text className="text-2xl font-bold text-gray-900">{title}</Text>
      <Text className="mt-2 text-center text-gray-500">{subtitle}</Text>
    </View>
  );
}
