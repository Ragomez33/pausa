import { useCallback, useEffect, useRef } from 'react';

import { AppState } from 'react-native';

import { getProfile } from '@/db/queries';
import { resetIdleNotificationFromProfile } from '@/shared/utils/notifications';
import { showAppToast } from '@/shared/utils/toast';

export function useIdleNotifications(ready: boolean, hasProfile: boolean): void {
  const noticeShownRef = useRef(false);

  const reset = useCallback((): void => {
    const profile = getProfile();
    if (profile === null) {
      return;
    }

    void resetIdleNotificationFromProfile().then((result) => {
      if (result.permissionGranted || noticeShownRef.current) {
        return;
      }
      noticeShownRef.current = true;
      showAppToast({
        title: 'Recordatorios desactivados',
        description: 'Activa las notificaciones para recibir avisos locales.',
        action: 'warning',
      });
    });
  }, []);

  useEffect(() => {
    if (!ready || !hasProfile) {
      return undefined;
    }

    reset();

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active' || state === 'background') {
        reset();
      }
    });

    return () => subscription.remove();
  }, [hasProfile, ready, reset]);
}
