import { TRIGGER_LABELS } from '@/shared/constants/triggers';
import type { TriggerEmotion } from '@/shared/types/global';

export interface TriggerOption {
  value: TriggerEmotion;
  label: string;
}

export const TRIGGER_VALUES = [
  'anxiety',
  'stress',
  'boredom',
  'habit_social',
  'anger_frustration',
] as const;

export const TRIGGER_OPTIONS: TriggerOption[] = [
  { value: 'anxiety', label: TRIGGER_LABELS.anxiety },
  { value: 'stress', label: TRIGGER_LABELS.stress },
  { value: 'boredom', label: TRIGGER_LABELS.boredom },
  { value: 'habit_social', label: TRIGGER_LABELS.habit_social },
  { value: 'anger_frustration', label: TRIGGER_LABELS.anger_frustration },
];

export const REFLECTION_DURATION_SECONDS = 12;

export const NOTES_MAX_LENGTH = 200;
