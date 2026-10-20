import type { ReactElement } from 'react';

import { useRouter, type Href } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';

import { ArrowLeft } from '@/shared/components/icons';
import { THEME_COLORS } from '@/shared/constants/theme';

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
}

export function SectionHeader({ title, subtitle }: SectionHeaderProps): ReactElement {
  const router = useRouter();

  function handleBack(): void {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/' as Href);
  }

  return (
    <View className="flex-row items-center gap-3">
      <TouchableOpacity
        onPress={handleBack}
        activeOpacity={0.82}
        accessibilityRole="button"
        accessibilityLabel="Volver"
        className="h-11 w-11 items-center justify-center rounded-full border border-border-card bg-card active:bg-border-card"
      >
        <ArrowLeft color={THEME_COLORS.accentStrong} size={20} strokeWidth={2.4} />
      </TouchableOpacity>

      <View className="flex-1">
        {subtitle !== undefined ? (
          <Text className="text-[10px] font-black uppercase tracking-[0.24em] text-text-secondary">
            {subtitle}
          </Text>
        ) : null}
        <Text className="text-2xl font-black tracking-tight text-text-primary">{title}</Text>
      </View>
    </View>
  );
}
