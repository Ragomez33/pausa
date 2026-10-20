import '../global.css';

import type { ReactElement } from 'react';
import { useEffect, useRef, useState } from 'react';

import { Stack, usePathname, useRouter, useSegments, type Href } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useTeamSync } from '@/modules/team/sync/useTeamSync';
import { THEME_COLORS } from '@/shared/constants/theme';
import { useDatabaseInitialized } from '@/shared/hooks/useDatabaseInitialized';
import { useIdleNotifications } from '@/shared/hooks/useIdleNotifications';
import { configureNotificationHandler } from '@/shared/utils/notifications';
import { shouldRedirectToOnboarding } from '@/shared/utils/routing';
import { readSmokingSessionNotificationData } from '@/shared/utils/sessionPromptSchedule';

export default function RootLayout(): ReactElement {
  const { ready, hasProfile, error, refresh } = useDatabaseInitialized();
  useIdleNotifications(ready, hasProfile);
  useTeamSync(ready);
  const router = useRouter();
  const pathname = usePathname();
  const segments = useSegments();
  const firstSegment = segments[0] ?? '';
  const [checkedPath, setCheckedPath] = useState<string | null>(null);
  const handledNotificationRef = useRef<string | null>(null);

  useEffect(() => {
    configureNotificationHandler();
  }, []);

  useEffect(() => {
    if (!ready) {
      return undefined;
    }

    function handleResponse(response: Notifications.NotificationResponse): void {
      const data = readSmokingSessionNotificationData(
        response.notification.request.content.data,
      );
      if (data === null) {
        return;
      }

      const identifier = response.notification.request.identifier;
      if (handledNotificationRef.current === identifier) {
        return;
      }
      handledNotificationRef.current = identifier;
      void Notifications.clearLastNotificationResponseAsync();

      if (pathname.startsWith('/smoking-session')) {
        return;
      }

      router.push(
        `/smoking-session?sessionId=${encodeURIComponent(
          data.sessionId,
        )}&trigger=${data.triggerEmotion}` as Href,
      );
    }

    const subscription = Notifications.addNotificationResponseReceivedListener(handleResponse);
    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response !== null) {
        handleResponse(response);
      }
    });

    return () => subscription.remove();
  }, [pathname, ready, router]);

  useEffect(() => {
    if (!ready) {
      return;
    }
    refresh();
    setCheckedPath(pathname);
  }, [pathname, ready, refresh]);

  useEffect(() => {
    if (!ready || checkedPath !== pathname) {
      return;
    }
    if (shouldRedirectToOnboarding(hasProfile, [firstSegment])) {
      router.replace('/onboarding');
    }
  }, [checkedPath, firstSegment, hasProfile, pathname, ready, router]);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <View className="flex-1 bg-background">
        {error ? (
          <View className="flex-1 items-center justify-center bg-background px-5">
            <Text className="text-center text-accent-strong">
              No se pudo inicializar la base de datos local.
            </Text>
            <Text className="mt-2 text-center text-sm text-text-secondary">{error.message}</Text>
          </View>
        ) : !ready ? (
          <View className="flex-1 items-center justify-center bg-background">
            <ActivityIndicator size="large" color={THEME_COLORS.brandOrange} />
          </View>
        ) : (
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: THEME_COLORS.background },
            }}
          >
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="pause" />
            <Stack.Screen name="smoking-session" />
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="team" />
          </Stack>
        )}
      </View>
    </SafeAreaProvider>
  );
}
