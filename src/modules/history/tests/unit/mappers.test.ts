import type { PauseEvent, SmokingEvent } from '@/db/schema';

import { OUTCOME_LABELS } from '../../utils/constants';
import {
  countHistoryTotals,
  countHistoryTriggers,
  getLatestCededTimestampFromEvents,
  mergeHistoryEvents,
  toHistoryEntry,
  type HistoryEvent,
} from '../../utils/mappers';

function pauseEvent(overrides: Partial<PauseEvent> = {}): PauseEvent {
  return {
    id: 1,
    syncId: 'sync-pause-1',
    ownerUserId: null,
    timestamp: '2026-10-19T10:30:00.000Z',
    triggerEmotion: 'anxiety',
    resisted: 1,
    notes: null,
    ...overrides,
  };
}

function smokingEvent(overrides: Partial<SmokingEvent> = {}): SmokingEvent {
  return {
    id: 1,
    syncId: 'sync-smoking-1',
    ownerUserId: null,
    timestamp: '2026-10-19T11:30:00.000Z',
    triggerEmotion: 'habit',
    durationSeconds: 300,
    inventoryDecremented: 1,
    ...overrides,
  };
}

function historyEvent(overrides: Partial<HistoryEvent> = {}): HistoryEvent {
  return {
    id: 'pause-1',
    timestamp: '2026-10-19T10:30:00.000Z',
    triggerEmotion: 'anxiety',
    resisted: true,
    notes: null,
    durationSeconds: null,
    ...overrides,
  };
}

describe('mergeHistoryEvents', () => {
  it('merges pauses and smoking sessions newest first', () => {
    const result = mergeHistoryEvents(
      [pauseEvent({ id: 2, timestamp: '2026-10-19T10:00:00.000Z' })],
      [smokingEvent({ id: 3, timestamp: '2026-10-19T12:00:00.000Z' })],
    );

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      id: 'smoking-3',
      resisted: false,
      durationSeconds: 300,
    });
    expect(result[1]).toMatchObject({ id: 'pause-2', resisted: true });
  });

  it('counts totals, triggers, and the latest ceded moment from both sources', () => {
    const events = mergeHistoryEvents(
      [
        pauseEvent({ id: 1, resisted: 1, triggerEmotion: 'anxiety' }),
        pauseEvent({ id: 2, resisted: 0, triggerEmotion: 'stress' }),
      ],
      [
        smokingEvent({ id: 7, timestamp: '2026-10-19T12:00:00.000Z' }),
        smokingEvent({ id: 8, timestamp: '2026-10-19T09:00:00.000Z' }),
      ],
    );

    expect(countHistoryTotals(events)).toEqual({ total: 4, resisted: 1, ceded: 3 });
    expect(countHistoryTriggers(events)).toEqual([
      { triggerEmotion: 'habit', count: 2 },
      { triggerEmotion: 'anxiety', count: 1 },
      { triggerEmotion: 'stress', count: 1 },
    ]);
    expect(getLatestCededTimestampFromEvents(events)).toBe(
      '2026-10-19T12:00:00.000Z',
    );
  });
});

describe('toHistoryEntry', () => {
  it('maps a resisted event with notes', () => {
    const result = toHistoryEntry(historyEvent({ notes: '  después de comer  ' }));

    expect(result.id).toBe('pause-1');
    expect(result.triggerLabel).toBe('Ansiedad');
    expect(result.outcomeLabel).toBe(OUTCOME_LABELS.resisted);
    expect(result.resisted).toBe(true);
    expect(result.notes).toBe('después de comer');
    expect(result.dateTimeLabel.length).toBeGreaterThan(0);
  });

  it('maps a legacy ceded pause event with the ceded label', () => {
    const result = toHistoryEntry(historyEvent({ resisted: false }));

    expect(result.outcomeLabel).toBe(OUTCOME_LABELS.ceded);
    expect(result.resisted).toBe(false);
  });

  it('maps a smoking session with the smoked label', () => {
    const result = toHistoryEntry(
      historyEvent({
        id: 'smoking-1',
        resisted: false,
        durationSeconds: 300,
        triggerEmotion: 'habit',
      }),
    );

    expect(result.outcomeLabel).toBe(OUTCOME_LABELS.smoked);
    expect(result.triggerLabel).toBe('Costumbre');
  });

  it('hides blank notes', () => {
    expect(toHistoryEntry(historyEvent({ notes: '   ' })).notes).toBeNull();
    expect(toHistoryEntry(historyEvent({ notes: null })).notes).toBeNull();
  });

  it('maps legacy trigger codes to readable labels', () => {
    expect(
      toHistoryEntry(historyEvent({ triggerEmotion: 'work_stress' })).triggerLabel,
    ).toBe('Estrés laboral');
  });
});
