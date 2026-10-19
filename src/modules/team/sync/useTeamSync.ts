import { useEffect, useState } from 'react';

import { AppState } from 'react-native';

import { isSupabaseConfigured } from '@/services/supabase';

import type { TeamSyncSnapshot } from './teamSync';
import {
  flushTeamOutbox,
  getTeamSyncStatusSnapshot,
  subscribeToTeamSync,
} from './teamSync';

const RETRY_INTERVAL_MS = 60_000;

export function useTeamSyncSnapshot(): TeamSyncSnapshot {
  const [snapshot, setSnapshot] = useState<TeamSyncSnapshot>(() =>
    getTeamSyncStatusSnapshot(),
  );

  useEffect(() => {
    const update = (): void => setSnapshot(getTeamSyncStatusSnapshot());
    update();
    return subscribeToTeamSync(update);
  }, []);

  return snapshot;
}

export function useTeamSync(ready: boolean): TeamSyncSnapshot {
  const snapshot = useTeamSyncSnapshot();

  useEffect(() => {
    if (!ready || !isSupabaseConfigured()) {
      return undefined;
    }

    void flushTeamOutbox();

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void flushTeamOutbox();
      }
    });

    const timer = setInterval(() => {
      if (getTeamSyncStatusSnapshot().pendingCount > 0) {
        void flushTeamOutbox();
      }
    }, RETRY_INTERVAL_MS);

    return () => {
      subscription.remove();
      clearInterval(timer);
    };
  }, [ready]);

  return snapshot;
}
