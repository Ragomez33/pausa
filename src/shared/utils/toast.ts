import { Alert, Platform, ToastAndroid } from 'react-native';

import type { AppToastOptions } from '../types/global';

export function showAppToast(options: AppToastOptions): void {
  const { title, description } = options;

  if (Platform.OS === 'android') {
    const message = description ? `${title}: ${description}` : title;
    ToastAndroid.show(message, ToastAndroid.SHORT);
    return;
  }

  Alert.alert(title, description);
}
