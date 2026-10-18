import type { ReactElement } from 'react';

import { Stack } from 'expo-router';

export default function TeamLayout(): ReactElement {
  return <Stack screenOptions={{ headerShown: false }} />;
}
