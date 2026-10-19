import { useCallback, useEffect, useRef, useState } from 'react';

import type { SmokingTrigger } from '@/shared/constants/smoking';
import { showAppToast } from '@/shared/utils/toast';

import { completeSmokingSession } from '../utils/service';

export interface UseSmokingSessionResult {
  elapsedSeconds: number;
  promptVisible: boolean;
  finishing: boolean;
  continueSession: () => void;
  finishSession: () => boolean;
}

export function useSmokingSession(trigger: SmokingTrigger): UseSmokingSessionResult {
  const startedAtRef = useRef(Date.now());
  const nextPromptRef = useRef(300);
  const finishingRef = useRef(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [promptVisible, setPromptVisible] = useState(false);
  const [finishing, setFinishing] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Math.max(
        0,
        Math.floor((Date.now() - startedAtRef.current) / 1_000),
      );
      setElapsedSeconds(elapsed);

      if (elapsed >= nextPromptRef.current) {
        while (elapsed >= nextPromptRef.current) {
          nextPromptRef.current += 300;
        }
        setPromptVisible(true);
      }
    }, 1_000);

    return () => clearInterval(interval);
  }, []);

  const continueSession = useCallback((): void => {
    setPromptVisible(false);
  }, []);

  const finishSession = useCallback((): boolean => {
    if (finishingRef.current) {
      return false;
    }
    finishingRef.current = true;
    setFinishing(true);

    const now = Date.now();
    const durationSeconds = Math.max(
      1,
      Math.floor((now - startedAtRef.current) / 1_000),
    );
    const result = completeSmokingSession({
      triggerEmotion: trigger,
      durationSeconds,
      nowMs: now,
    });

    if (result.error !== null) {
      finishingRef.current = false;
      setFinishing(false);
      showAppToast({
        title: 'No se pudo registrar',
        description: result.error.message,
        action: 'error',
      });
      return false;
    }

    setPromptVisible(false);
    setFinishing(false);
    showAppToast({
      title: 'Sesión registrada',
      description: result.inventoryDecremented
        ? 'Se descontó un cigarrillo del inventario.'
        : 'Sin inventario disponible; el stock se mantiene en cero.',
      action: 'success',
    });
    return true;
  }, [trigger]);

  return {
    elapsedSeconds,
    promptVisible,
    finishing,
    continueSession,
    finishSession,
  };
}
