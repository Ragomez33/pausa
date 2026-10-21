import {
  isSmokingTrigger,
  type SmokingTrigger,
} from '@/shared/constants/smoking';

export const SESSION_NOTIFICATION_DATA_TYPE = 'smoking-session';
export const SESSION_NOTIFICATION_ID_PREFIX = 'smoking-session';
export const SESSION_PROMPT_INTERVAL_MINUTES = 5;
export const SESSION_PROMPT_COUNT = 12;
export const SESSION_PROMPT_MAX_MINUTES =
  SESSION_PROMPT_INTERVAL_MINUTES * SESSION_PROMPT_COUNT;
export const STALE_SESSION_MINUTES = 30;

export interface SessionPrompt {
  index: number;
  minutes: number;
  scheduledAtMs: number;
  identifier: string;
}

export interface SmokingSessionNotificationData extends Record<string, unknown> {
  type: typeof SESSION_NOTIFICATION_DATA_TYPE;
  sessionId: string;
  startedAtMs: number;
  triggerEmotion: SmokingTrigger;
}

export function buildSessionPromptBody(minutes: number): string {
  return `Llevas ${minutes} minutos fumando. Abre Pausa para cerrar la sesión.`;
}

export function buildSessionNotificationIdentifier(
  sessionId: string,
  minutes: number,
): string {
  return `${SESSION_NOTIFICATION_ID_PREFIX}:${sessionId}:${minutes}`;
}

export function isSessionNotificationIdentifier(identifier: string): boolean {
  return identifier.startsWith(`${SESSION_NOTIFICATION_ID_PREFIX}:`);
}

export function createSessionId(nowMs: number): string {
  const safeNow = Number.isFinite(nowMs) ? Math.floor(nowMs) : Date.now();
  return `session-${safeNow}-${Math.random().toString(36).slice(2, 8)}`;
}

function clampCount(count: number): number {
  if (!Number.isFinite(count)) {
    return SESSION_PROMPT_COUNT;
  }
  return Math.min(SESSION_PROMPT_COUNT, Math.max(1, Math.floor(count)));
}

export function computeSessionPrompts(
  sessionId: string,
  startedAtMs: number,
  nowMs: number,
  count = SESSION_PROMPT_COUNT,
): SessionPrompt[] {
  if (sessionId.length === 0) {
    return [];
  }

  const safeStart = Number.isFinite(startedAtMs) ? startedAtMs : nowMs;
  const safeNow = Number.isFinite(nowMs) ? nowMs : Date.now();
  const promptCount = clampCount(count);
  const prompts: SessionPrompt[] = [];

  for (let index = 1; index <= promptCount; index += 1) {
    const minutes = index * SESSION_PROMPT_INTERVAL_MINUTES;
    const scheduledAtMs = safeStart + minutes * 60_000;

    if (scheduledAtMs > safeNow) {
      prompts.push({
        index,
        minutes,
        scheduledAtMs,
        identifier: buildSessionNotificationIdentifier(sessionId, minutes),
      });
    }
  }

  return prompts;
}

export function shouldOfferStaleSession(
  startedAtMs: number,
  nowMs: number,
  thresholdMinutes = STALE_SESSION_MINUTES,
): boolean {
  if (!Number.isFinite(startedAtMs) || !Number.isFinite(nowMs)) {
    return false;
  }
  return nowMs - startedAtMs >= thresholdMinutes * 60_000;
}

/**
 * Last five-minute boundary reached by the session, capped at the final prompt
 * (60 minutes). Used by the foreground fallback so the UI can surface a prompt
 * even when Android deferred or batched the OS alarms.
 */
export function computePromptBoundaryMinutes(
  startedAtMs: number,
  nowMs: number,
): number {
  if (!Number.isFinite(startedAtMs) || !Number.isFinite(nowMs)) {
    return 0;
  }

  const elapsedMinutes = Math.floor((nowMs - startedAtMs) / 60_000);
  if (elapsedMinutes < SESSION_PROMPT_INTERVAL_MINUTES) {
    return 0;
  }

  const boundary =
    Math.floor(elapsedMinutes / SESSION_PROMPT_INTERVAL_MINUTES) *
    SESSION_PROMPT_INTERVAL_MINUTES;
  return Math.min(boundary, SESSION_PROMPT_MAX_MINUTES);
}

/**
 * Returns the new boundary the foreground UI should announce, or null when no
 * boundary was crossed since the last announced one.
 */
export function resolveForegroundPromptMinutes(
  startedAtMs: number,
  lastAnnouncedMinutes: number,
  nowMs: number,
): number | null {
  const boundary = computePromptBoundaryMinutes(startedAtMs, nowMs);
  const safeLast = Number.isFinite(lastAnnouncedMinutes) ? lastAnnouncedMinutes : 0;

  if (boundary <= safeLast) {
    return null;
  }

  return boundary;
}

export function buildSmokingSessionNotificationData(input: {
  sessionId: string;
  startedAtMs: number;
  triggerEmotion: SmokingTrigger;
}): SmokingSessionNotificationData {
  return {
    type: SESSION_NOTIFICATION_DATA_TYPE,
    sessionId: input.sessionId,
    startedAtMs: input.startedAtMs,
    triggerEmotion: input.triggerEmotion,
  };
}

export function readSmokingSessionNotificationData(
  data: Record<string, unknown> | undefined,
): SmokingSessionNotificationData | null {
  if (data === undefined || data.type !== SESSION_NOTIFICATION_DATA_TYPE) {
    return null;
  }

  const sessionId = data.sessionId;
  const startedAtMs = data.startedAtMs;
  const triggerEmotion = data.triggerEmotion;

  if (typeof sessionId !== 'string' || sessionId.length === 0) {
    return null;
  }
  if (typeof startedAtMs !== 'number' || !Number.isFinite(startedAtMs)) {
    return null;
  }

  return {
    type: SESSION_NOTIFICATION_DATA_TYPE,
    sessionId,
    startedAtMs,
    triggerEmotion:
      typeof triggerEmotion === 'string' && isSmokingTrigger(triggerEmotion)
        ? triggerEmotion
        : 'habit',
  };
}
