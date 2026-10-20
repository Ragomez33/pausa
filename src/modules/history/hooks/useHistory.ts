import { useCallback, useState } from 'react';

import { useFocusEffect } from 'expo-router';

import {
  getLatestCededTimestamp,
  getPauseTotals,
  getProfile,
  listInventoryLogs,
  listPauseEvents,
  listTriggerCounts,
} from '@/db/queries';
import type { PauseEvent } from '@/db/schema';

import {
  computeAvoidedCigarettes,
  computeMoneySaved,
} from '@/shared/utils/derivedMetrics';
import { computeInventorySummary } from '@/shared/utils/inventory';

import {
  computePauseAnalytics,
  type HistorySummary,
  type PauseAnalytics,
} from '../utils/analytics';

interface HistoryState {
  loading: boolean;
  hasProfile: boolean;
  events: PauseEvent[];
  analytics: PauseAnalytics | null;
  summary: HistorySummary | null;
  error: Error | null;
}

export interface UseHistoryResult {
  loading: boolean;
  hasProfile: boolean;
  events: PauseEvent[];
  analytics: PauseAnalytics | null;
  summary: HistorySummary | null;
  error: Error | null;
  refresh: () => void;
}

export function useHistory(): UseHistoryResult {
  const [state, setState] = useState<HistoryState>({
    loading: true,
    hasProfile: false,
    events: [],
    analytics: null,
    summary: null,
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
          summary: null,
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
      const inventory = computeInventorySummary(
        listInventoryLogs(),
        profile.dailyCigarettes,
        profile.currency,
      );
      const avoidedCigarettes = computeAvoidedCigarettes(
        profile.dailyCigarettes,
        analytics.elapsedMs,
      );
      const summary: HistorySummary = {
        avoidedCigarettes,
        moneySaved: computeMoneySaved(avoidedCigarettes, profile.packCost),
        inventorySpending: inventory.totalSpending,
        currency: profile.currency,
      };

      setState({
        loading: false,
        hasProfile: true,
        events,
        analytics,
        summary,
        error: null,
      });
    } catch (caught) {
      setState({
        loading: false,
        hasProfile: false,
        events: [],
        analytics: null,
        summary: null,
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
