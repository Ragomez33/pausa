import { useCallback, useState } from 'react';

import { useFocusEffect } from 'expo-router';

import {
  getProfile,
  listInventoryLogs,
  listPauseEvents,
  listSmokingEvents,
} from '@/db/queries';

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
import type { HistoryEvent } from '../utils/mappers';
import {
  countHistoryTotals,
  countHistoryTriggers,
  getLatestCededTimestampFromEvents,
  mergeHistoryEvents,
} from '../utils/mappers';

interface HistoryState {
  loading: boolean;
  hasProfile: boolean;
  events: HistoryEvent[];
  analytics: PauseAnalytics | null;
  summary: HistorySummary | null;
  error: Error | null;
}

export interface UseHistoryResult {
  loading: boolean;
  hasProfile: boolean;
  events: HistoryEvent[];
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

      const events = mergeHistoryEvents(listPauseEvents(), listSmokingEvents());
      const totals = countHistoryTotals(events);
      const counts = countHistoryTriggers(events);
      const latestCeded = getLatestCededTimestampFromEvents(events);
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
