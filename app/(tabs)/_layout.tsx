import type { ReactElement } from 'react';

import { Tabs } from 'expo-router';

import { THEME_COLORS } from '@/shared/constants/theme';

export default function MainTabsLayout(): ReactElement {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        lazy: false,
        animation: 'none',
        tabBarStyle: { display: 'none' },
        sceneStyle: { backgroundColor: THEME_COLORS.background },
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="history" />
      <Tabs.Screen name="inventory" />
      <Tabs.Screen name="badges" />
      <Tabs.Screen name="team" />
    </Tabs>
  );
}
