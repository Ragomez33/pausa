export type DifficultyLevel = 'facil' | 'medio' | 'dificil' | 'modo_dios';

export interface DifficultyOption {
  value: DifficultyLevel;
  label: string;
  multiplier: number;
}

export const DIFFICULTY_OPTIONS: DifficultyOption[] = [
  { value: 'facil', label: 'Fácil', multiplier: 1 },
  { value: 'medio', label: 'Medio', multiplier: 0.75 },
  { value: 'dificil', label: 'Difícil', multiplier: 0.5 },
  { value: 'modo_dios', label: 'Modo Dios', multiplier: 0.25 },
];

export function calculateDailyLimit(
  dailyCigarettes: number,
  level: DifficultyLevel,
): number {
  if (!Number.isFinite(dailyCigarettes) || dailyCigarettes <= 0) {
    return 0;
  }
  const option = DIFFICULTY_OPTIONS.find((entry) => entry.value === level);
  if (option === undefined) {
    return 0;
  }
  return Math.max(0, Math.floor(dailyCigarettes * option.multiplier));
}

export function getDifficultyLabel(level: DifficultyLevel): string {
  return DIFFICULTY_OPTIONS.find((entry) => entry.value === level)?.label ?? level;
}
