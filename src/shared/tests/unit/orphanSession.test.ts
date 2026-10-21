import {
  ORPHAN_SESSION_MINUTES,
  isOrphanSmokingSession,
} from '../../utils/orphanSession';

describe('isOrphanSmokingSession', () => {
  const now = 10_000_000;

  it('keeps recent sessions alive', () => {
    expect(isOrphanSmokingSession(now - 5 * 60_000, now)).toBe(false);
    expect(
      isOrphanSmokingSession(now - (ORPHAN_SESSION_MINUTES - 1) * 60_000, now),
    ).toBe(false);
  });

  it('releases sessions at the orphan threshold', () => {
    expect(isOrphanSmokingSession(now - ORPHAN_SESSION_MINUTES * 60_000, now)).toBe(true);
    expect(isOrphanSmokingSession(now - 5 * 60 * 60_000, now)).toBe(true);
  });

  it('releases sessions with invalid or future timestamps', () => {
    expect(isOrphanSmokingSession(Number.NaN, now)).toBe(true);
    expect(isOrphanSmokingSession(now + 60_000, now)).toBe(true);
    expect(isOrphanSmokingSession(now, Number.NaN)).toBe(true);
  });
});
