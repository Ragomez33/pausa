import type { PauseEvent } from '@/db/schema';
import { formatDateTime } from '@/shared/utils/utils';
import { getTriggerLabel } from '@/shared/utils/triggers';

import { OUTCOME_LABELS } from './constants';

export interface HistoryEntry {
  id: number;
  timestamp: string;
  dateTimeLabel: string;
  triggerLabel: string;
  outcomeLabel: string;
  resisted: boolean;
  notes: string | null;
}

export function toHistoryEntry(event: PauseEvent): HistoryEntry {
  const trimmedNotes = event.notes?.trim();
  const resisted = event.resisted === 1;

  return {
    id: event.id,
    timestamp: event.timestamp,
    dateTimeLabel: formatDateTime(event.timestamp),
    triggerLabel: getTriggerLabel(event.triggerEmotion),
    outcomeLabel: resisted ? OUTCOME_LABELS.resisted : OUTCOME_LABELS.ceded,
    resisted,
    notes: trimmedNotes !== undefined && trimmedNotes.length > 0 ? trimmedNotes : null,
  };
}
