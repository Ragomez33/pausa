import '../global.css';

import type { ReactElement } from 'react';
import { useEffect } from 'react';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useDatabaseInitialized } from '@/shared/hooks/useDatabaseInitialized';
import { configureNotificationHandler } from '@/shared/utils/notifications';

export default function RootLayout(): ReactElement {
  const { ready, error } = useDatabaseInitialized();

  useEffect(() => {
    configureNotificationHandler();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      {error ? (
        <View className="flex-1 items-center justify-center px-5">
          <Text className="text-center text-red-600">
            No se pudo inicializar la base de datos local.
          </Text>
        </View>
      ) : !ready ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="pause" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="team" />
        </Stack>
      )}
    </SafeAreaProvider>
  );
}

