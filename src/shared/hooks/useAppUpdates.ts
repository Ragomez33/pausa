import { useEffect, useRef } from 'react';

import { Alert, AppState, type AppStateStatus } from 'react-native';

export function useAppUpdates(): void {
  const appState = useRef(AppState.currentState);
  const promptedRef = useRef(false);

  useEffect(() => {
    async function onFetchUpdateAsync(): Promise<void> {
      if (__DEV__ || promptedRef.current) {
        return;
      }

      try {
        // Expo Go does not include the native expo-updates module. Importing it
        // dynamically keeps Expo Go usable while still enabling OTA in builds.
        const Updates = await import('expo-updates');
        const update = await Updates.checkForUpdateAsync();

        if (!update.isAvailable) {
          return;
        }

        await Updates.fetchUpdateAsync();
        promptedRef.current = true;

        Alert.alert(
          'Nueva versión disponible 🚀',
          'Se han aplicado mejoras en Pausa. ¿Deseas reiniciar la app para cargarlas ahora?',
          [
            { text: 'Más tarde', style: 'cancel' },
            { text: 'Reiniciar', onPress: () => void Updates.reloadAsync() },
          ],
        );
      } catch (error) {
        console.warn('Error buscando actualizaciones OTA:', error);
      }
    }

    void onFetchUpdateAsync();

    const subscription = AppState.addEventListener(
      'change',
      (nextAppState: AppStateStatus) => {
        if (
          appState.current.match(/inactive|background/) &&
          nextAppState === 'active'
        ) {
          void onFetchUpdateAsync();
        }
        appState.current = nextAppState;
      },
    );

    return () => {
      subscription.remove();
    };
  }, []);
}
