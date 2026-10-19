import type { PauseEvent } from '@/db/schema';

import { OUTCOME_LABELS } from '../../utils/constants';
import { toHistoryEntry } from '../../utils/mappers';

function event(overrides: Partial<PauseEvent> = {}): PauseEvent {
  return {
    id: 1,
    timestamp: '2026-10-19T10:30:00.000Z',
    triggerEmotion: 'anxiety',
    resisted: 1,
    notes: null,
    ...overrides,
  };
}

describe('toHistoryEntry', () => {
  it('maps a resisted event with notes', () => {
    const result = toHistoryEntry(event({ notes: '  después de comer  ' }));

    expect(result.id).toBe(1);
    expect(result.triggerLabel).toBe('Ansiedad');
    expect(result.outcomeLabel).toBe(OUTCOME_LABELS.resisted);
    expect(result.resisted).toBe(true);
    expect(result.notes).toBe('después de comer');
    expect(result.dateTimeLabel.length).toBeGreaterThan(0);
  });

  it('maps a ceded event with the ceded label', () => {
    const result = toHistoryEntry(event({ resisted: 0 }));

    expect(result.outcomeLabel).toBe(OUTCOME_LABELS.ceded);
    expect(result.resisted).toBe(false);
  });

  it('hides blank notes', () => {
    expect(toHistoryEntry(event({ notes: '   ' })).notes).toBeNull();
    expect(toHistoryEntry(event({ notes: null })).notes).toBeNull();
  });

  it('maps legacy trigger codes to readable labels', () => {
    expect(toHistoryEntry(event({ triggerEmotion: 'work_stress' })).triggerLabel).toBe(
      'Estrés laboral',
    );
  });
});
