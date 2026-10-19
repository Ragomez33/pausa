export type BadgeConditionType = 'resistedPauses' | 'streakDays' | 'moneySaved';

export interface BadgeDefinition {
  key: string;
  title: string;
  description: string;
  conditionType: BadgeConditionType;
  target: number;
  unit: string;
}

export const BADGE_CATALOG: BadgeDefinition[] = [
  {
    key: 'first_pause',
    title: 'Primer paso',
    description: 'Registra tu primera pausa exitosa.',
    conditionType: 'resistedPauses',
    target: 1,
    unit: 'pausas',
  },
  {
    key: 'five_pauses',
    title: 'Cinco pausas',
    description: 'Logra cinco pausas exitosas.',
    conditionType: 'resistedPauses',
    target: 5,
    unit: 'pausas',
  },
  {
    key: '1_day_clean',
    title: 'Un día limpio',
    description: 'Mantén tu racha durante un día.',
    conditionType: 'streakDays',
    target: 1,
    unit: 'días',
  },
  {
    key: '1_week_clean',
    title: 'Una semana limpia',
    description: 'Mantén tu racha durante siete días.',
    conditionType: 'streakDays',
    target: 7,
    unit: 'días',
  },
  {
    key: '1_month_clean',
    title: 'Un mes limpio',
    description: 'Mantén tu racha durante treinta días.',
    conditionType: 'streakDays',
    target: 30,
    unit: 'días',
  },
  {
    key: 'money_saver_10',
    title: 'Ahorrador',
    description: 'Ahorra 10 unidades en tu moneda.',
    conditionType: 'moneySaved',
    target: 10,
    unit: 'unidades',
  },
];
