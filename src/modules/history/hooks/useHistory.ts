import { useCallback, useState } from 'react';

import { useFocusEffect } from 'expo-router';

import {
  getLatestCededTimestamp,
  getPauseTotals,
  getProfile,
  listPauseEvents,
  listTriggerCounts,
} from '@/db/queries';
import type { PauseEvent } from '@/db/schema';

import { computePauseAnalytics, type PauseAnalytics } from '../utils/analytics';

interface HistoryState {
  loading: boolean;
  hasProfile: boolean;
  events: PauseEvent[];
  analytics: PauseAnalytics | null;
  error: Error | null;
}

export interface UseHistoryResult {
  loading: boolean;
  hasProfile: boolean;
  events: PauseEvent[];
  analytics: PauseAnalytics | null;
  error: Error | null;
  refresh: () => void;
}

export function useHistory(): UseHistoryResult {
  const [state, setState] = useState<HistoryState>({
    loading: true,
    hasProfile: false,
    events: [],
    analytics: null,
    error: null,
  });

  const load = useCallback((): void => {
    try {
      const profile = getProfile();
      if (profile === null) {
        setState({
          loading: false,
          hasProfile: false,
          events: [],
          analytics: null,
          error: null,
        });
        return;
      }

      const events = listPauseEvents();
      const totals = getPauseTotals();
      const counts = listTriggerCounts();
      const latestCeded = getLatestCededTimestamp();
      const analytics = computePauseAnalytics(
        totals,
        counts,
        profile.createdAt,
        latestCeded,
        Date.now(),
      );

      setState({
        loading: false,
        hasProfile: true,
        events,
        analytics,
        error: null,
      });
    } catch (caught) {
      setState({
        loading: false,
        hasProfile: false,
        events: [],
        analytics: null,
        error: caught instanceof Error ? caught : new Error('Error de base de datos'),
      });
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return { ...state, refresh: load };
}
