import { useCallback, useEffect, useRef, useState } from 'react';

import {
  clearActiveSmokingSession,
  getActiveSmokingSession,
  startActiveSmokingSession,
} from '@/db/queries';
import type { ActiveSmokingSession } from '@/db/schema';
import { enqueueTeamSharedEvent } from '@/modules/team/sync/teamSync';
import type { SmokingTrigger } from '@/shared/constants/smoking';
import { isSmokingTrigger } from '@/shared/constants/smoking';
import {
  cancelIdleNotification,
  cancelSessionPrompts,
  resetIdleNotificationFromProfile,
  scheduleSessionPrompts,
} from '@/shared/utils/notifications';
import {
  createSessionId,
  shouldOfferStaleSession,
} from '@/shared/utils/sessionPromptSchedule';
import { showAppToast } from '@/shared/utils/toast';

import { completeSmokingSession } from '../utils/service';
import { nextPromptBoundary } from '../utils/session';

export type SmokingSessionModal = 'none' | 'finishPrompt' | 'stalePrompt';

export interface UseSmokingSessionResult {
  trigger: SmokingTrigger;
  elapsedSeconds: number;
  activeModal: SmokingSessionModal;
  finishing: boolean;
  missingSession: boolean;
  continueSession: () => void;
  finishSession: () => boolean;
  discardSession: () => boolean;
}

function resolveActiveSession(
  trigger: SmokingTrigger,
  requestedSessionId: string | undefined,
): ActiveSmokingSession | null {
  const existing = getActiveSmokingSession();
  if (existing !== null) {
    return existing;
  }

  if (requestedSessionId !== undefined) {
    return null;
  }

  const nowMs = Date.now();
  return startActiveSmokingSession({
    id: createSessionId(nowMs),
    triggerEmotion: trigger,
    startedAtMs: nowMs,
    createdAt: new Date(nowMs).toISOString(),
  });
}

function elapsedSecondsSince(startedAtMs: number, nowMs: number): number {
  return Math.max(0, Math.floor((nowMs - startedAtMs) / 1_000));
}

export function useSmokingSession(
  trigger: SmokingTrigger,
  requestedSessionId?: string,
): UseSmokingSessionResult {
  const sessionRef = useRef<ActiveSmokingSession | null>(null);
  const startedAtRef = useRef(Date.now());
  const nextPromptRef = useRef(300);
  const finishingRef = useRef(false);
  const staleShownRef = useRef(false);
  const mountedRef = useRef(true);

  const [missingSession, setMissingSession] = useState(false);
  const [sessionTrigger, setSessionTrigger] = useState<SmokingTrigger>(trigger);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [activeModal, setActiveModal] = useState<SmokingSessionModal>('none');
  const [finishing, setFinishing] = useState(false);

  useEffect(() => {
    mountedRef.current = true;

    let resolved: ActiveSmokingSession | null = null;
    try {
      resolved = resolveActiveSession(trigger, requestedSessionId);
    } catch {
      setMissingSession(true);
      return () => {
        mountedRef.current = false;
      };
    }

    if (resolved === null) {
      setMissingSession(true);
      return () => {
        mountedRef.current = false;
      };
    }

    const resolvedSession = resolved;
    const initialElapsed = elapsedSecondsSince(resolvedSession.startedAtMs, Date.now());
    sessionRef.current = resolvedSession;
    startedAtRef.current = resolvedSession.startedAtMs;
    nextPromptRef.current = Math.max(nextPromptBoundary(initialElapsed), 300);

    if (shouldOfferStaleSession(resolvedSession.startedAtMs, Date.now())) {
      staleShownRef.current = true;
      setActiveModal('stalePrompt');
    }

    setElapsedSeconds(initialElapsed);
    setSessionTrigger(
      isSmokingTrigger(resolvedSession.triggerEmotion)
        ? resolvedSession.triggerEmotion
        : trigger,
    );

    void cancelIdleNotification();
    void scheduleSessionPrompts({
      sessionId: resolvedSession.id,
      startedAtMs: resolvedSession.startedAtMs,
      triggerEmotion: isSmokingTrigger(resolvedSession.triggerEmotion)
        ? resolvedSession.triggerEmotion
        : trigger,
    }).then((result) => {
      if (!mountedRef.current || result.permissionGranted) {
        return;
      }
      showAppToast({
        title: 'Avisos desactivados',
        description: 'Activa las notificaciones para recibir el aviso de cada cinco minutos.',
        action: 'warning',
      });
    });

    const interval = setInterval(() => {
      const elapsed = elapsedSecondsSince(startedAtRef.current, Date.now());
      setElapsedSeconds(elapsed);

      if (!staleShownRef.current && shouldOfferStaleSession(startedAtRef.current, Date.now())) {
        staleShownRef.current = true;
        setActiveModal('stalePrompt');
        return;
      }

      if (elapsed >= nextPromptRef.current) {
        while (elapsed >= nextPromptRef.current) {
          nextPromptRef.current += 300;
        }
        setActiveModal((current) => (current === 'none' ? 'finishPrompt' : current));
      }
    }, 1_000);

    return () => {
      mountedRef.current = false;
      clearInterval(interval);
      sessionRef.current = null;
      void cancelSessionPrompts();
      clearActiveSmokingSession(resolvedSession.id);
      void resetIdleNotificationFromProfile();
    };
  }, [requestedSessionId, trigger]);

  const continueSession = useCallback((): void => {
    setActiveModal((current) => (current === 'finishPrompt' ? 'none' : current));
  }, []);

  const finishSession = useCallback((): boolean => {
    const activeSession = sessionRef.current;
    if (finishingRef.current || activeSession === null) {
      return false;
    }
    finishingRef.current = true;
    setFinishing(true);

    const now = Date.now();
    const durationSeconds = elapsedSecondsSince(activeSession.startedAtMs, now);
    const result = completeSmokingSession({
      sessionId: activeSession.id,
      triggerEmotion: isSmokingTrigger(activeSession.triggerEmotion)
        ? activeSession.triggerEmotion
        : 'habit',
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

    sessionRef.current = null;
    setActiveModal('none');
    setFinishing(false);
    void cancelSessionPrompts();
    void resetIdleNotificationFromProfile();
    enqueueTeamSharedEvent('smoked');
    showAppToast({
      title: 'Sesión registrada',
      description: result.inventoryDecremented
        ? 'Se descontó un cigarrillo del inventario.'
        : 'Sin inventario disponible; el stock se mantiene en cero.',
      action: 'success',
    });
    return true;
  }, []);

  const discardSession = useCallback((): boolean => {
    const activeSession = sessionRef.current;
    if (finishingRef.current || activeSession === null) {
      return false;
    }
    finishingRef.current = true;
    setFinishing(true);

    try {
      clearActiveSmokingSession(activeSession.id);
    } catch {
      finishingRef.current = false;
      setFinishing(false);
      showAppToast({
        title: 'No se pudo descartar',
        description: 'Inténtalo de nuevo.',
        action: 'error',
      });
      return false;
    }

    sessionRef.current = null;
    setActiveModal('none');
    setFinishing(false);
    void cancelSessionPrompts();
    void resetIdleNotificationFromProfile();
    showAppToast({
      title: 'Sesión descartada',
      description: 'No se registró ningún cigarrillo.',
      action: 'warning',
    });
    return true;
  }, []);

  return {
    trigger: sessionTrigger,
    elapsedSeconds,
    activeModal,
    finishing,
    missingSession,
    continueSession,
    finishSession,
    discardSession,
  };
}
