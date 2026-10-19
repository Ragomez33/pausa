import { useCallback, useState } from 'react';

import { useFocusEffect } from 'expo-router';

import {
  countSmokingEventsBetween,
  getProfile,
  listInventoryLogs,
  listPauseEvents,
} from '@/db/queries';
import type { HomeMetrics } from '@/shared/types/global';
import { getLocalDayRange } from '@/shared/utils/dayRange';

import { computeHomeMetrics } from '../utils/metrics';

export interface UseHomeMetricsResult {
  loading: boolean;
  hasProfile: boolean;
  metrics: HomeMetrics | null;
  error: Error | null;
  refresh: () => void;
}

interface HomeMetricsState {
  loading: boolean;
  hasProfile: boolean;
  metrics: HomeMetrics | null;
  error: Error | null;
}

const REFRESH_INTERVAL_MS = 30_000;

export function useHomeMetrics(): UseHomeMetricsResult {
  const [state, setState] = useState<HomeMetricsState>({
    loading: true,
    hasProfile: false,
    metrics: null,
    error: null,
  });

  const load = useCallback((): void => {
    try {
      const profile = getProfile();
      if (profile === null) {
        setState({ loading: false, hasProfile: false, metrics: null, error: null });
        return;
      }
      const events = listPauseEvents();
      const inventoryLogs = listInventoryLogs();
      const now = Date.now();
      const dayRange = getLocalDayRange(now);
      const smokedToday = countSmokingEventsBetween(dayRange.startIso, dayRange.endIso);
      setState({
        loading: false,
        hasProfile: true,
        metrics: computeHomeMetrics(profile, events, now, inventoryLogs, smokedToday),
        error: null,
      });
    } catch (caught) {
      setState({
        loading: false,
        hasProfile: false,
        metrics: null,
        error: caught instanceof Error ? caught : new Error('Error de base de datos'),
      });
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
      const interval = setInterval(load, REFRESH_INTERVAL_MS);
      return () => clearInterval(interval);
    }, [load]),
  );

  return { ...state, refresh: load };
}
