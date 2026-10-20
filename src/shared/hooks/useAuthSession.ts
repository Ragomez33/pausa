import { useEffect, useState } from 'react';

import {
  getAuthSnapshot,
  initializeAuth,
  subscribeToAuth,
  type AuthSessionSnapshot,
} from '@/shared/services/authService';

export function useAuthSession(ready: boolean): AuthSessionSnapshot {
  const [snapshot, setSnapshot] = useState<AuthSessionSnapshot>(() =>
    getAuthSnapshot(),
  );

  useEffect(() => {
    if (!ready) {
      return undefined;
    }

    initializeAuth();
    const update = (): void => setSnapshot(getAuthSnapshot());
    update();
    return subscribeToAuth(update);
  }, [ready]);

  return snapshot;
}
