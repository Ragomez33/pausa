import {
  buildSmokingEvent,
  formatDuration,
  nextPromptBoundary,
} from '../../utils/session';

describe('formatDuration', () => {
  it('formats minutes and seconds', () => {
    expect(formatDuration(0)).toBe('0:00');
    expect(formatDuration(65)).toBe('1:05');
    expect(formatDuration(599)).toBe('9:59');
  });

  it('formats hours when needed', () => {
    expect(formatDuration(3_661)).toBe('1:01:01');
  });

  it('clamps invalid values', () => {
    expect(formatDuration(-10)).toBe('0:00');
    expect(formatDuration(Number.NaN)).toBe('0:00');
  });
});

describe('nextPromptBoundary', () => {
  it('returns the next five-minute boundary', () => {
    expect(nextPromptBoundary(0)).toBe(300);
    expect(nextPromptBoundary(299)).toBe(300);
    expect(nextPromptBoundary(300)).toBe(600);
    expect(nextPromptBoundary(601)).toBe(900);
  });
});

describe('buildSmokingEvent', () => {
  it('maps a completed session with an ISO timestamp and flags', () => {
    const result = buildSmokingEvent({
      syncId: 'sync-1',
      ownerUserId: null,
      nowMs: 1_000,
      triggerEmotion: 'anxiety_stress',
      durationSeconds: 305,
      inventoryDecremented: true,
    });

    expect(result.timestamp).toBe(new Date(1_000).toISOString());
    expect(result.triggerEmotion).toBe('anxiety_stress');
    expect(result.durationSeconds).toBe(305);
    expect(result.inventoryDecremented).toBe(1);
  });

  it('enforces a minimum one-second duration and false flag', () => {
    const result = buildSmokingEvent({
      syncId: 'sync-2',
      ownerUserId: null,
      nowMs: 2_000,
      triggerEmotion: 'habit',
      durationSeconds: 0,
      inventoryDecremented: false,
    });

    expect(result.durationSeconds).toBe(1);
    expect(result.inventoryDecremented).toBe(0);
  });
});
