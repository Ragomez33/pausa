import type { PauseEvent, SmokingEvent } from '@/db/schema';
import type { PauseTotals, TriggerCount } from '@/shared/types/global';
import { getTriggerLabel } from '@/shared/utils/triggers';
import { formatDateTime } from '@/shared/utils/utils';

import { OUTCOME_LABELS } from './constants';

export interface HistoryEvent {
  id: string;
  timestamp: string;
  triggerEmotion: string;
  resisted: boolean;
  notes: string | null;
  durationSeconds: number | null;
}

export interface HistoryEntry {
  id: string;
  timestamp: string;
  dateTimeLabel: string;
  triggerLabel: string;
  outcomeLabel: string;
  resisted: boolean;
  notes: string | null;
}

function timestampMs(timestamp: string): number {
  const parsed = Date.parse(timestamp);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function mergeHistoryEvents(
  pauses: PauseEvent[],
  smokingEvents: SmokingEvent[],
): HistoryEvent[] {
  const events: HistoryEvent[] = [
    ...pauses.map((event) => ({
      id: `pause-${event.id}`,
      timestamp: event.timestamp,
      triggerEmotion: event.triggerEmotion,
      resisted: event.resisted === 1,
      notes: event.notes,
      durationSeconds: null,
    })),
    ...smokingEvents.map((event) => ({
      id: `smoking-${event.id}`,
      timestamp: event.timestamp,
      triggerEmotion: event.triggerEmotion,
      resisted: false,
      notes: null,
      durationSeconds: event.durationSeconds,
    })),
  ];

  return events.sort((left, right) => {
    const difference = timestampMs(right.timestamp) - timestampMs(left.timestamp);
    if (difference !== 0) {
      return difference;
    }
    return right.id.localeCompare(left.id);
  });
}

export function countHistoryTotals(events: HistoryEvent[]): PauseTotals {
  const resisted = events.filter((event) => event.resisted).length;
  return {
    total: events.length,
    resisted,
    ceded: events.length - resisted,
  };
}

export function countHistoryTriggers(events: HistoryEvent[]): TriggerCount[] {
  const counts = new Map<string, number>();

  for (const event of events) {
    counts.set(event.triggerEmotion, (counts.get(event.triggerEmotion) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([triggerEmotion, count]) => ({ triggerEmotion, count }))
    .sort((left, right) => {
      if (right.count !== left.count) {
        return right.count - left.count;
      }
      return left.triggerEmotion.localeCompare(right.triggerEmotion);
    });
}

export function getLatestCededTimestampFromEvents(
  events: HistoryEvent[],
): string | null {
  let latest: string | null = null;
  let latestMs = 0;

  for (const event of events) {
    if (event.resisted) {
      continue;
    }
    const parsed = timestampMs(event.timestamp);
    if (parsed > latestMs) {
      latest = event.timestamp;
      latestMs = parsed;
    }
  }

  return latest;
}

export function toHistoryEntry(event: HistoryEvent): HistoryEntry {
  const trimmedNotes = event.notes?.trim();
  const outcomeLabel = event.resisted
    ? OUTCOME_LABELS.resisted
    : event.durationSeconds !== null
      ? OUTCOME_LABELS.smoked
      : OUTCOME_LABELS.ceded;

  return {
    id: event.id,
    timestamp: event.timestamp,
    dateTimeLabel: formatDateTime(event.timestamp),
    triggerLabel: getTriggerLabel(event.triggerEmotion),
    outcomeLabel,
    resisted: event.resisted,
    notes: trimmedNotes !== undefined && trimmedNotes.length > 0 ? trimmedNotes : null,
  };
}
