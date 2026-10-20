import {
  SESSION_NOTIFICATION_ID_PREFIX,
  SESSION_NOTIFICATION_DATA_TYPE,
  SESSION_PROMPT_COUNT,
  SESSION_PROMPT_INTERVAL_MINUTES,
  buildSessionNotificationIdentifier,
  buildSessionPromptBody,
  buildSmokingSessionNotificationData,
  computeSessionPrompts,
  createSessionId,
  isSessionNotificationIdentifier,
  readSmokingSessionNotificationData,
  shouldOfferStaleSession,
} from '../../utils/sessionPromptSchedule';

describe('computeSessionPrompts', () => {
  const startedAtMs = 1_000_000;

  it('schedules twelve prompts at five-minute boundaries', () => {
    const prompts = computeSessionPrompts('session-1', startedAtMs, startedAtMs);

    expect(prompts).toHaveLength(SESSION_PROMPT_COUNT);
    expect(prompts[0]).toEqual({
      index: 1,
      minutes: SESSION_PROMPT_INTERVAL_MINUTES,
      scheduledAtMs: startedAtMs + 5 * 60_000,
      identifier: 'smoking-session:session-1:5',
    });
    expect(prompts[11]?.minutes).toBe(60);
    expect(prompts[11]?.scheduledAtMs).toBe(startedAtMs + 60 * 60_000);
  });

  it('skips prompts already in the past when resuming', () => {
    const nowMs = startedAtMs + 12 * 60_000;
    const prompts = computeSessionPrompts('session-1', startedAtMs, nowMs);

    expect(prompts[0]?.minutes).toBe(15);
    expect(prompts).toHaveLength(10);
    expect(prompts.every((prompt) => prompt.scheduledAtMs > nowMs)).toBe(true);
  });

  it('returns no prompts for an empty session id', () => {
    expect(computeSessionPrompts('', startedAtMs, startedAtMs)).toEqual([]);
  });

  it('caps the requested count at twelve prompts', () => {
    expect(computeSessionPrompts('session-1', startedAtMs, startedAtMs, 99)).toHaveLength(12);
    expect(computeSessionPrompts('session-1', startedAtMs, startedAtMs, 0)).toHaveLength(1);
  });
});

describe('session notification identifiers', () => {
  it('uses a stable prefix and unique identifiers', () => {
    const first = buildSessionNotificationIdentifier('session-1', 5);
    const second = buildSessionNotificationIdentifier('session-1', 10);

    expect(first).toBe(`${SESSION_NOTIFICATION_ID_PREFIX}:session-1:5`);
    expect(first).not.toBe(second);
    expect(isSessionNotificationIdentifier(first)).toBe(true);
    expect(isSessionNotificationIdentifier('idle-reminder')).toBe(false);
  });

  it('creates readable session ids', () => {
    expect(createSessionId(42)).toMatch(/^session-42-/);
  });
});

describe('session prompt content', () => {
  it('builds the expected body for each boundary', () => {
    expect(buildSessionPromptBody(5)).toBe(
      'Llevas 5 minutos fumando. Abre Pausa para cerrar la sesión.',
    );
    expect(buildSessionPromptBody(60)).toBe(
      'Llevas 60 minutos fumando. Abre Pausa para cerrar la sesión.',
    );
  });
});

describe('shouldOfferStaleSession', () => {
  it('starts offering options at thirty minutes', () => {
    expect(shouldOfferStaleSession(0, 29 * 60_000)).toBe(false);
    expect(shouldOfferStaleSession(0, 30 * 60_000)).toBe(true);
    expect(shouldOfferStaleSession(0, 45 * 60_000)).toBe(true);
  });

  it('handles invalid input safely', () => {
    expect(shouldOfferStaleSession(Number.NaN, 1)).toBe(false);
    expect(shouldOfferStaleSession(0, Number.NaN)).toBe(false);
  });
});

describe('readSmokingSessionNotificationData', () => {
  const data = buildSmokingSessionNotificationData({
    sessionId: 'session-1',
    startedAtMs: 1_000,
    triggerEmotion: 'anxiety_stress',
  });

  it('reads a valid session payload', () => {
    expect(readSmokingSessionNotificationData(data)).toEqual(data);
  });

  it('falls back to the habit trigger for unknown values', () => {
    expect(
      readSmokingSessionNotificationData({
        type: SESSION_NOTIFICATION_DATA_TYPE,
        sessionId: 'session-1',
        startedAtMs: 1_000,
        triggerEmotion: 'unknown',
      }),
    ).toEqual({
      type: SESSION_NOTIFICATION_DATA_TYPE,
      sessionId: 'session-1',
      startedAtMs: 1_000,
      triggerEmotion: 'habit',
    });
  });

  it('rejects unrelated or malformed payloads', () => {
    expect(readSmokingSessionNotificationData(undefined)).toBeNull();
    expect(readSmokingSessionNotificationData({ type: 'other' })).toBeNull();
    expect(
      readSmokingSessionNotificationData({
        type: SESSION_NOTIFICATION_DATA_TYPE,
        sessionId: '',
        startedAtMs: 1_000,
      }),
    ).toBeNull();
    expect(
      readSmokingSessionNotificationData({
        type: SESSION_NOTIFICATION_DATA_TYPE,
        sessionId: 'session-1',
        startedAtMs: 'soon',
      }),
    ).toBeNull();
  });
});
