export const TEAM_RANKS = [
  { name: 'El Guardián', description: 'Mantiene la constancia del equipo día tras día.' },
  { name: 'El Inquebrantable', description: 'Resiste los impulsos sin romper la racha.' },
  { name: 'El Resiliente', description: 'Vuelve al camino después de cada tropiezo.' },
] as const;

export const GOAL_LEVEL_LABELS: Record<string, string> = {
  facil: 'Fácil',
  medio: 'Medio',
  dificil: 'Difícil',
  modo_dios: 'Modo Dios',
};
