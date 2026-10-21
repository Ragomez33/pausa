/**
 * An active smoking session is considered orphaned when the app process died
 * before its cleanup ran. The threshold matches the stale-session threshold
 * used by the session UI, so a session that would already be offered as
 * "¿Olvidaste cerrar la sesión?" is cleared on the next cold start instead of
 * silently blocking every idle reminder.
 */
export const ORPHAN_SESSION_MINUTES = 30;

export function isOrphanSmokingSession(
  startedAtMs: number,
  nowMs: number,
  thresholdMinutes = ORPHAN_SESSION_MINUTES,
): boolean {
  if (!Number.isFinite(startedAtMs) || !Number.isFinite(nowMs)) {
    return true;
  }

  const safeThreshold =
    Number.isFinite(thresholdMinutes) && thresholdMinutes > 0
      ? thresholdMinutes
      : ORPHAN_SESSION_MINUTES;
  const elapsedMs = nowMs - startedAtMs;

  if (elapsedMs < 0) {
    return true;
  }

  return elapsedMs >= safeThreshold * 60_000;
}
