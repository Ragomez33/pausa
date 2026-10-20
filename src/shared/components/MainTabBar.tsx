import type { ReactElement } from 'react';

import { usePathname, useRouter, type Href } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';

import { THEME_COLORS } from '@/shared/constants/theme';
import { MAIN_TABS, type MainTab } from '@/shared/constants/tabs';

function isTabActive(pathname: string, tab: MainTab): boolean {
  if (tab.route === '/') {
    return (
      pathname === '/' ||
      pathname === '/index' ||
      pathname === '/(tabs)' ||
      pathname === '/(tabs)/index'
    );
  }
  return pathname === tab.route || pathname.startsWith(`${tab.route}/`);
}

export function MainTabBar(): ReactElement {
  const router = useRouter();
  const pathname = usePathname();

  function handlePress(tab: MainTab): void {
    if (isTabActive(pathname, tab)) {
      return;
    }
    router.navigate(tab.route as Href);
  }

  return (
    <View className="flex-row gap-1 rounded-3xl border border-border-card bg-card p-1.5">
      {MAIN_TABS.map((tab) => {
        const Icon = tab.icon;
        const active = isTabActive(pathname, tab);

        return (
          <TouchableOpacity
            key={tab.key}
            onPress={() => handlePress(tab)}
            activeOpacity={0.82}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            className={`flex-1 items-center justify-center gap-0.5 rounded-2xl px-0 py-2 ${
              active ? 'bg-brand-orange active:bg-accent-pressed' : 'active:bg-border-card'
            }`}
          >
            <Icon
              color={active ? THEME_COLORS.white : THEME_COLORS.textSecondary}
              size={14}
              strokeWidth={active ? 2.6 : 2.2}
            />
            <Text
              numberOfLines={1}
              className={`text-[9px] font-black tracking-tighter ${
                active ? 'text-white' : 'text-text-secondary'
              }`}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
