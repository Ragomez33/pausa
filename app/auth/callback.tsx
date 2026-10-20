import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';

import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { ActivityIndicator, Text, View } from 'react-native';

import { completeMagicLink } from '@/shared/services/authService';
import { THEME_COLORS } from '@/shared/constants/theme';

export default function AuthCallbackRoute(): ReactElement {
  const router = useRouter();
  const currentUrl = Linking.useURL();
  const params = useLocalSearchParams<{ code?: string; error_description?: string }>();
  const [message, setMessage] = useState('Procesando enlace...');

  useEffect(() => {
    const fallbackQuery =
      params.error_description !== undefined
        ? `error_description=${encodeURIComponent(params.error_description)}`
        : `code=${encodeURIComponent(params.code ?? '')}`;
    const url =
      currentUrl ??
      (fallbackQuery.length > 0
        ? `pausa://auth/callback?${fallbackQuery}`
        : 'pausa://auth/callback');

    void completeMagicLink(url).then((result) => {
      if (result.error !== null) {
        setMessage(result.error.message);
        return;
      }
      router.replace('/account' as Href);
    });
  }, [currentUrl, params.code, params.error_description, router]);

  return (
    <View className="flex-1 items-center justify-center bg-background px-6">
      <ActivityIndicator size="large" color={THEME_COLORS.brandOrange} />
      <Text className="mt-4 text-center text-sm text-text-secondary">{message}</Text>
    </View>
  );
}
