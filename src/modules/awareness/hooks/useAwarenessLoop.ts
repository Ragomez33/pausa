import { useCallback, useRef, useState } from 'react';

import type { PauseEvent } from '@/db/schema';
import {
  getScopedOwnerUserId,
  recordPostponedPause,
} from '@/db/queries';
import { AWARENESS_MESSAGES } from '@/shared/constants/messages';
import { enqueueTeamSharedEvent } from '@/modules/team/sync/teamSync';
import { SMOKING_TRIGGER_LABELS, type SmokingTrigger } from '@/shared/constants/smoking';
import { resetIdleNotificationFromProfile } from '@/shared/utils/notifications';
import { enqueuePersonalSync } from '@/shared/services/syncEngine';
import { getBackupPreferences } from '@/shared/services/syncPreferences';
import { buildPauseSyncPayload } from '@/shared/utils/personalSyncPayloads';
import { showAppToast } from '@/shared/utils/toast';

import type { AwarenessStep } from '../utils/constants';
import { POSTPONE_POSITIVE_MESSAGE } from '../utils/constants';
import { pickMessage } from '../utils/messages';

export interface UseAwarenessLoopResult {
  step: AwarenessStep;
  selectedTrigger: SmokingTrigger | null;
  selectedTriggerLabel: string | null;
  message: string;
  confirmPostpone: () => boolean;
  declinePostpone: () => void;
  selectEmotion: (trigger: SmokingTrigger) => void;
}

export function useAwarenessLoop(): UseAwarenessLoopResult {
  const [step, setStep] = useState<AwarenessStep>('postpone');
  const [selectedTrigger, setSelectedTrigger] = useState<SmokingTrigger | null>(null);
  const [messageIndex, setMessageIndex] = useState(-1);
  const savingRef = useRef(false);

  const confirmPostpone = useCallback((): boolean => {
    if (savingRef.current) {
      return false;
    }
    savingRef.current = true;

    let pauseEvent: PauseEvent;
    try {
      pauseEvent = recordPostponedPause(new Date().toISOString());
    } catch {
      savingRef.current = false;
      showAppToast({
        title: 'No se pudo guardar',
        description: 'Inténtalo de nuevo.',
        action: 'error',
      });
      return false;
    }

    const ownerUserId = getScopedOwnerUserId();
    if (ownerUserId !== null) {
      enqueuePersonalSync(
        'smoking_event',
        pauseEvent.syncId,
        buildPauseSyncPayload(
          pauseEvent,
          ownerUserId,
          getBackupPreferences().consentEmotions,
        ),
      );
    }

    void resetIdleNotificationFromProfile();
    enqueueTeamSharedEvent('posponed');
    showAppToast({
      title: 'Pausa registrada',
      description: POSTPONE_POSITIVE_MESSAGE,
      action: 'success',
    });
    return true;
  }, []);

  const declinePostpone = useCallback((): void => {
    setStep('emotion');
  }, []);

  const selectEmotion = useCallback(
    (trigger: SmokingTrigger): void => {
      setSelectedTrigger(trigger);
      const picked = pickMessage(AWARENESS_MESSAGES, messageIndex);
      setMessageIndex(picked.index);
      setStep('message');
    },
    [messageIndex],
  );

  return {
    step,
    selectedTrigger,
    selectedTriggerLabel:
      selectedTrigger !== null ? SMOKING_TRIGGER_LABELS[selectedTrigger] : null,
    message: messageIndex >= 0 ? (AWARENESS_MESSAGES[messageIndex] ?? '') : '',
    confirmPostpone,
    declinePostpone,
    selectEmotion,
  };
}
