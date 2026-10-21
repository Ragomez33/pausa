import { useCallback, useEffect, useRef } from 'react';

import { AppState } from 'react-native';

import {
  clearActiveSmokingSession,
  getActiveSmokingSession,
  getProfile,
  getSyncState,
  setSyncState,
} from '@/db/queries';
import {
  EXACT_ALARM_HINT_DESCRIPTION,
  EXACT_ALARM_HINT_STATE_KEY,
  EXACT_ALARM_HINT_TITLE,
} from '@/shared/constants/notifications';
import {
  cancelIdleNotification,
  cancelSessionPrompts,
  ensureIdleNotificationFromProfile,
  resetIdleNotificationFromProfile,
  type IdleScheduleResult,
} from '@/shared/utils/notifications';
import { shouldGuideExactAlarmSetup } from '@/shared/utils/exactAlarms';
import { isOrphanSmokingSession } from '@/shared/utils/orphanSession';
import { showAppToast } from '@/shared/utils/toast';

type IdleSyncMode = 'ensure' | 'reset';

function releaseOrphanActiveSession(nowMs = Date.now()): boolean {
  const session = getActiveSmokingSession();
  if (session === null || !isOrphanSmokingSession(session.startedAtMs, nowMs)) {
    return false;
  }

  try {
    clearActiveSmokingSession(session.id);
    return true;
  } catch {
    return false;
  }
}

export function useIdleNotifications(ready: boolean, hasProfile: boolean): void {
  const noticeShownRef = useRef(false);
  const exactAlarmHintShownRef = useRef(false);

  const showDisabledNotice = useCallback((result: IdleScheduleResult): void => {
    if (result.permissionGranted || noticeShownRef.current) {
      return;
    }
    noticeShownRef.current = true;
    showAppToast({
      title: 'Recordatorios desactivados',
      description: 'Activa las notificaciones para recibir avisos locales.',
      action: 'warning',
    });
  }, []);

  const maybeShowExactAlarmHint = useCallback((): void => {
    if (exactAlarmHintShownRef.current || !shouldGuideExactAlarmSetup()) {
      return;
    }
    exactAlarmHintShownRef.current = true;

    try {
      if (getSyncState(EXACT_ALARM_HINT_STATE_KEY) !== null) {
        return;
      }
      setSyncState(EXACT_ALARM_HINT_STATE_KEY, 'shown');
    } catch {
      return;
    }

    showAppToast({
      title: EXACT_ALARM_HINT_TITLE,
      description: EXACT_ALARM_HINT_DESCRIPTION,
      action: 'info',
    });
  }, []);

  const syncIdle = useCallback(
    (mode: IdleSyncMode, releaseOrphan = false): void => {
      if (getProfile() === null) {
        return;
      }

      if (releaseOrphan && releaseOrphanActiveSession()) {
        void cancelSessionPrompts();
      }

      if (getActiveSmokingSession() !== null) {
        void cancelIdleNotification();
        return;
      }

      const request =
        mode === 'reset'
          ? resetIdleNotificationFromProfile()
          : ensureIdleNotificationFromProfile();

      void request.then((result) => {
        showDisabledNotice(result);
        if (result.permissionGranted) {
          maybeShowExactAlarmHint();
        }
      });
    },
    [maybeShowExactAlarmHint, showDisabledNotice],
  );

  useEffect(() => {
    if (!ready || !hasProfile) {
      return undefined;
    }

    syncIdle('ensure', true);

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        syncIdle('ensure');
        return;
      }
      if (state === 'background') {
        syncIdle('reset');
      }
    });

    return () => subscription.remove();
  }, [hasProfile, ready, syncIdle]);
}
