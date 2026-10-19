import { useCallback, useState } from 'react';

import { useFocusEffect } from 'expo-router';

import { getProfile, listPauseEvents } from '@/db/queries';
import type { HomeMetrics } from '@/shared/types/global';

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
      setState({
        loading: false,
        hasProfile: true,
        metrics: computeHomeMetrics(profile, events),
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
    }, [load]),
  );

  return { ...state, refresh: load };
}
