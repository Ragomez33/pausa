import type { TriggerEmotion } from '@/shared/types/global';

export interface TriggerOption {
  value: TriggerEmotion;
  label: string;
}

export const TRIGGER_OPTIONS: TriggerOption[] = [
  { value: 'anxiety', label: 'Ansiedad' },
  { value: 'work_stress', label: 'Estrés laboral' },
  { value: 'coffee_social', label: 'Café/Social' },
  { value: 'boredom', label: 'Aburrimiento' },
];

export const REFLECTION_DURATION_SECONDS = 15;
