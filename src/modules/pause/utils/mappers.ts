import type { NewPauseEvent } from '@/db/schema';
import type { TriggerEmotion } from '@/shared/types/global';

export interface PauseEventInput {
  timestamp: number;
  triggerEmotion: TriggerEmotion;
  resisted: boolean;
  notes?: string;
}

export function buildPauseEvent(input: PauseEventInput): NewPauseEvent {
  return {
    timestamp: new Date(input.timestamp).toISOString(),
    triggerEmotion: input.triggerEmotion,
    resisted: input.resisted ? 1 : 0,
    notes: input.notes ?? null,
  };
}
