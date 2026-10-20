import { useEffect, useState } from 'react';

import { AppState } from 'react-native';

import {
  PERSONAL_SYNC_TIMER_MS,
  flushPersonalOutbox,
  getPersonalSyncSnapshot,
  subscribeToPersonalSync,
  type PersonalSyncSnapshot,
} from '@/shared/services/syncEngine';
import { subscribeToAuth } from '@/shared/services/authService';

export function usePersonalSyncSnapshot(): PersonalSyncSnapshot {
  const [snapshot, setSnapshot] = useState<PersonalSyncSnapshot>(() =>
    getPersonalSyncSnapshot(),
  );

  useEffect(() => {
    const update = (): void => setSnapshot(getPersonalSyncSnapshot());
    update();
    return subscribeToPersonalSync(update);
  }, []);

  return snapshot;
}

export function usePersonalSync(ready: boolean): PersonalSyncSnapshot {
  const snapshot = usePersonalSyncSnapshot();

  useEffect(() => {
    if (!ready) {
      return undefined;
    }

    void flushPersonalOutbox();

    const appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void flushPersonalOutbox();
      }
    });
    const authSubscription = subscribeToAuth(() => {
      void flushPersonalOutbox();
    });
    const timer = setInterval(() => {
      if (getPersonalSyncSnapshot().pendingCount > 0) {
        void flushPersonalOutbox();
      }
    }, PERSONAL_SYNC_TIMER_MS);

    return () => {
      appStateSubscription.remove();
      authSubscription();
      clearInterval(timer);
    };
  }, [ready]);

  return snapshot;
}
