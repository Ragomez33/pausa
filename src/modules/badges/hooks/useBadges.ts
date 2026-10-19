import { useCallback, useState } from 'react';

import { useFocusEffect } from 'expo-router';

import {
  getLatestCededTimestamp,
  getPauseTotals,
  getProfile,
  listUserBadges,
} from '@/db/queries';
import { formatUnlockMessage } from '../utils/feedback';
import type { BadgeStatus } from '../utils/evaluate';
import { evaluateBadges } from '../utils/evaluate';
import { buildBadgeState, evaluateAndUnlockBadges } from '../utils/service';
import { showAppToast } from '@/shared/utils/toast';

interface BadgesState {
  loading: boolean;
  hasProfile: boolean;
  statuses: BadgeStatus[];
  unlockedCount: number;
  error: Error | null;
}

export interface UseBadgesResult extends BadgesState {
  refresh: () => void;
}

export function useBadges(): UseBadgesResult {
  const [state, setState] = useState<BadgesState>({
    loading: true,
    hasProfile: false,
    statuses: [],
    unlockedCount: 0,
    error: null,
  });

  const load = useCallback((): void => {
    try {
      const outcome = evaluateAndUnlockBadges(Date.now());
      if (outcome.error !== null) {
        throw outcome.error;
      }

      const message = formatUnlockMessage(outcome.newBadges);
      if (message !== null) {
        showAppToast({
          title: '¡Nuevo logro!',
          description: message,
          action: 'success',
        });
      }

      const profile = getProfile();
      if (profile === null) {
        setState({
          loading: false,
          hasProfile: false,
          statuses: [],
          unlockedCount: 0,
          error: null,
        });
        return;
      }

      const totals = getPauseTotals();
      const latestCeded = getLatestCededTimestamp();
      const badges = listUserBadges();
      const unlockedAtByKey = new Map(badges.map((badge) => [badge.badgeKey, badge.unlockedAt]));
      const badgeState = buildBadgeState(profile, totals, latestCeded, Date.now());
      const { statuses: baseStatuses } = evaluateBadges(badgeState, badges.map((b) => b.badgeKey));

      setState({
        loading: false,
        hasProfile: true,
        statuses: baseStatuses.map((status) => {
          const unlockedAt = unlockedAtByKey.get(status.definition.key);
          return unlockedAt !== undefined ? { ...status, unlockedAt } : status;
        }),
        unlockedCount: baseStatuses.filter((status) => status.unlocked).length,
        error: null,
      });
    } catch (caught) {
      setState({
        loading: false,
        hasProfile: false,
        statuses: [],
        unlockedCount: 0,
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
