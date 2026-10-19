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
  { value: 'anxiety', label: 'Ansiedad' },
  { value: 'stress', label: 'Estrés' },
  { value: 'boredom', label: 'Aburrimiento' },
  { value: 'habit_social', label: 'Hábito/Social' },
  { value: 'anger_frustration', label: 'Ira/Frustración' },
];

export const REFLECTION_DURATION_SECONDS = 12;

export const NOTES_MAX_LENGTH = 200;
