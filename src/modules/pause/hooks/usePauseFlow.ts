import { useCallback, useEffect, useState } from 'react';

import { createPauseEvent } from '@/db/queries';
import type { TriggerEmotion } from '@/shared/types/global';
import { showAppToast } from '@/shared/utils/toast';

import { REFLECTION_DURATION_SECONDS } from '../utils/constants';
import { buildPauseEvent } from '../utils/mappers';

export interface UsePauseFlowResult {
  secondsRemaining: number;
  isRunning: boolean;
  selectedTrigger: TriggerEmotion | null;
  saving: boolean;
  selectTrigger: (trigger: TriggerEmotion) => void;
  saveOutcome: (resisted: boolean) => boolean;
}

export function usePauseFlow(): UsePauseFlowResult {
  const [secondsRemaining, setSecondsRemaining] = useState(REFLECTION_DURATION_SECONDS);
  const [selectedTrigger, setSelectedTrigger] = useState<TriggerEmotion | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (secondsRemaining === 0) {
      return undefined;
    }
    const timer = setTimeout(() => {
      setSecondsRemaining((previous) => Math.max(0, previous - 1));
    }, 1000);
    return () => clearTimeout(timer);
  }, [secondsRemaining]);

  const saveOutcome = useCallback(
    (resisted: boolean): boolean => {
      if (secondsRemaining > 0) {
        showAppToast({ title: 'Espera un momento', description: 'Respira antes de registrar.' });
        return false;
      }
      if (selectedTrigger === null) {
        showAppToast({ title: 'Selecciona un disparador', action: 'warning' });
        return false;
      }

      setSaving(true);
      try {
        createPauseEvent(
          buildPauseEvent({ timestamp: Date.now(), triggerEmotion: selectedTrigger, resisted }),
        );
      } catch {
        setSaving(false);
        showAppToast({
          title: 'No se pudo guardar',
          description: 'Inténtalo de nuevo.',
          action: 'error',
        });
        return false;
      }
      setSaving(false);
      return true;
    },
    [secondsRemaining, selectedTrigger],
  );

  return {
    secondsRemaining,
    isRunning: secondsRemaining > 0,
    selectedTrigger,
    saving,
    selectTrigger: setSelectedTrigger,
    saveOutcome,
  };
}
