import { DIFFICULTY_OPTIONS, type DifficultyLevel } from './difficulty';

export const DURATION_OPTIONS = [7, 14, 30, 60] as const;

export const DEFAULT_DURATION_DAYS = 14;

export const TEAM_RANKS = [
  { name: 'El Guardián', description: 'Integrante con más cigarrillos pospuestos.' },
  { name: 'El Inquebrantable', description: 'Mayor racha de días cumpliendo su límite.' },
  { name: 'El Resiliente', description: 'Tuvo un tropiezo y sigue dentro de la meta.' },
] as const;

export const LEVEL_OPTIONS: { value: DifficultyLevel; label: string }[] =
  DIFFICULTY_OPTIONS.map((option) => ({
    value: option.value,
    label: option.label,
  }));
