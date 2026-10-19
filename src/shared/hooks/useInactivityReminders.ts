import { useEffect, useRef } from 'react';

import { getProfile } from '@/db/queries';
import { scheduleInactivityReminders } from '@/shared/utils/notifications';
import { showAppToast } from '@/shared/utils/toast';

export function useInactivityReminders(): void {
  const requestedRef = useRef(false);

  useEffect(() => {
    if (requestedRef.current) {
      return;
    }

    const profile = getProfile();
    if (profile === null) {
      return;
    }

    requestedRef.current = true;

    void scheduleInactivityReminders(profile.dailyCigarettes).then((result) => {
      if (!result.permissionGranted) {
        showAppToast({
          title: 'Recordatorios desactivados',
          description: 'Activa las notificaciones para recibir avisos locales.',
          action: 'warning',
        });
      }
    });
  }, []);
}
