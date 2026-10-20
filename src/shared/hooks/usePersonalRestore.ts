import { useCallback, useEffect, useRef, useState } from 'react';

import { useAuthSession } from '@/shared/hooks/useAuthSession';
import { enqueueUnsyncedPersonalData } from '@/shared/services/personalBackfill';
import {
  pullPersonalData,
  type RestoreProgress,
} from '@/shared/services/personalRestore';

export interface UsePersonalRestoreResult {
  restoring: boolean;
  progress: RestoreProgress | null;
  error: Error | null;
  restore: () => Promise<void>;
}

export function usePersonalRestore(
  ready: boolean,
  enabled: boolean,
): UsePersonalRestoreResult {
  const auth = useAuthSession(ready);
  const [restoring, setRestoring] = useState(false);
  const [progress, setProgress] = useState<RestoreProgress | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const runningRef = useRef(false);

  const restore = useCallback(async (): Promise<void> => {
    if (
      runningRef.current ||
      auth.status !== 'authenticated' ||
      auth.userId === null
    ) {
      return;
    }

    runningRef.current = true;
    setRestoring(true);
    setError(null);

    const result = await pullPersonalData(auth.userId, setProgress);
    if (result.error === null) {
      enqueueUnsyncedPersonalData(auth.userId);
    } else {
      setError(result.error);
    }

    runningRef.current = false;
    setRestoring(false);
  }, [auth.status, auth.userId]);

  useEffect(() => {
    if (!ready || !enabled || auth.status !== 'authenticated') {
      return;
    }
    void restore();
  }, [auth.status, enabled, ready, restore]);

  return { restoring, progress, error, restore };
}
