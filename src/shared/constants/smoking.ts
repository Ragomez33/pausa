export type SmokingTrigger =
  | 'anxiety_stress'
  | 'boredom'
  | 'habit'
  | 'social_pressure';

export const SMOKING_TRIGGER_LABELS: Record<SmokingTrigger, string> = {
  anxiety_stress: 'Ansiedad/Estrés',
  boredom: 'Aburrimiento',
  habit: 'Costumbre',
  social_pressure: 'Presión Social',
};

export function isSmokingTrigger(value: string | undefined): value is SmokingTrigger {
  return (
    value === 'anxiety_stress' ||
    value === 'boredom' ||
    value === 'habit' ||
    value === 'social_pressure'
  );
}
