import { useCallback, useEffect, useRef, useState } from 'react';

import { createPauseEvent } from '@/db/queries';
import type { TriggerEmotion } from '@/shared/types/global';
import { showAppToast } from '@/shared/utils/toast';

import { REFLECTION_DURATION_SECONDS } from '../utils/constants';
import { buildPauseEvent } from '../utils/mappers';
import { pauseFormSchema } from '../utils/schema';

interface PauseFormState {
  triggerEmotion: TriggerEmotion | null;
  notes: string;
}

export interface UsePauseFlowResult {
  secondsRemaining: number;
  isRunning: boolean;
  selectedTrigger: TriggerEmotion | null;
  notes: string;
  saving: boolean;
  selectTrigger: (trigger: TriggerEmotion) => void;
  setNotes: (notes: string) => void;
  saveOutcome: (resisted: boolean) => boolean;
}

export function usePauseFlow(): UsePauseFlowResult {
  const [secondsRemaining, setSecondsRemaining] = useState(REFLECTION_DURATION_SECONDS);
  const [form, setForm] = useState<PauseFormState>({
    triggerEmotion: null,
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);

  useEffect(() => {
    if (secondsRemaining === 0) {
      return undefined;
    }
    const timer = setTimeout(() => {
      setSecondsRemaining((previous) => Math.max(0, previous - 1));
    }, 1000);
    return () => clearTimeout(timer);
  }, [secondsRemaining]);

  const selectTrigger = useCallback((trigger: TriggerEmotion): void => {
    setForm((previous) => ({ ...previous, triggerEmotion: trigger }));
  }, []);

  const setNotes = useCallback((notes: string): void => {
    setForm((previous) => ({ ...previous, notes }));
  }, []);

  const saveOutcome = useCallback(
    (resisted: boolean): boolean => {
      if (secondsRemaining > 0) {
        showAppToast({ title: 'Espera un momento', description: 'Respira antes de registrar.' });
        return false;
      }
      if (savingRef.current) {
        return false;
      }

      const parsed = pauseFormSchema.safeParse(form);
      if (!parsed.success) {
        showAppToast({
          title: 'Revisa los datos',
          description: parsed.error.issues[0]?.message ?? 'Selecciona un disparador',
          action: 'warning',
        });
        return false;
      }

      savingRef.current = true;
      setSaving(true);

      const notes = parsed.data.notes.length > 0 ? parsed.data.notes : undefined;
      const payload = buildPauseEvent({
        timestamp: Date.now(),
        triggerEmotion: parsed.data.triggerEmotion,
        resisted,
        notes,
      });

      try {
        createPauseEvent(payload);
      } catch {
        savingRef.current = false;
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
    [form, secondsRemaining],
  );

  return {
    secondsRemaining,
    isRunning: secondsRemaining > 0,
    selectedTrigger: form.triggerEmotion,
    notes: form.notes,
    saving,
    selectTrigger,
    setNotes,
    saveOutcome,
  };
}
