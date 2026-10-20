import { useCallback, useState } from 'react';

import { useFocusEffect } from 'expo-router';

import type { BadgeDefinition } from '../utils/catalog';
import { formatUnlockMessage } from '../utils/feedback';
import { evaluateAndUnlockBadges } from '../utils/service';
import { getScopedOwnerUserId } from '@/db/queries';
import { enqueuePersonalSync } from '@/shared/services/syncEngine';
import { buildAchievementSyncPayload } from '@/shared/utils/personalSyncPayloads';
import { showAppToast } from '@/shared/utils/toast';

export interface UseBadgeEvaluationResult {
  newBadges: BadgeDefinition[];
  error: Error | null;
  evaluate: () => void;
}

export function useBadgeEvaluation(): UseBadgeEvaluationResult {
  const [newBadges, setNewBadges] = useState<BadgeDefinition[]>([]);
  const [error, setError] = useState<Error | null>(null);

  const evaluate = useCallback((): void => {
    const outcome = evaluateAndUnlockBadges(Date.now());
    setNewBadges(outcome.newBadges);
    setError(outcome.error);

    const ownerUserId = getScopedOwnerUserId();
    if (ownerUserId !== null) {
      for (const badge of outcome.newBadgeRows) {
        enqueuePersonalSync(
          'achievement',
          badge.syncId,
          buildAchievementSyncPayload(badge, ownerUserId),
        );
      }
    }

    const message = formatUnlockMessage(outcome.newBadges);
    if (message !== null) {
      showAppToast({
        title: '¡Nuevo logro!',
        description: message,
        action: 'success',
      });
    }

    if (outcome.error !== null) {
      showAppToast({
        title: 'No se pudieron comprobar los logros',
        description: outcome.error.message,
        action: 'error',
      });
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      evaluate();
    }, [evaluate]),
  );

  return { newBadges, error, evaluate };
}
