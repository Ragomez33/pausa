import { SMOKING_TRIGGER_LABELS, type SmokingTrigger } from '@/shared/constants/smoking';

export type AwarenessStep = 'postpone' | 'emotion' | 'message';

export interface AwarenessEmotion {
  value: SmokingTrigger;
  label: string;
}

export const AWARENESS_EMOTIONS: AwarenessEmotion[] = [
  { value: 'anxiety_stress', label: SMOKING_TRIGGER_LABELS.anxiety_stress },
  { value: 'boredom', label: SMOKING_TRIGGER_LABELS.boredom },
  { value: 'habit', label: SMOKING_TRIGGER_LABELS.habit },
  { value: 'social_pressure', label: SMOKING_TRIGGER_LABELS.social_pressure },
];

export const POSTPONE_POSITIVE_MESSAGE =
  'Bien hecho. Has ganado unos minutos de control.';
