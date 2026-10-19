import { DIFFICULTY_OPTIONS, type DifficultyLevel } from './difficulty';

export const DURATION_OPTIONS = [7, 14, 30, 60] as const;

export const DEFAULT_DURATION_DAYS = 14;

export const DEFAULT_TEAM_USER_NAME = 'Tú';

export const TEAM_RANKS = [
  { name: 'El Guardián', description: 'Integrante con más cigarrillos pospuestos.' },
  { name: 'El Inquebrantable', description: 'Mayor racha de días cumpliendo su límite.' },
  { name: 'El Resiliente', description: 'Tuvo un tropiezo y sigue dentro de la meta.' },
] as const;

export const SYNC_STATUS_LABELS: Record<string, string> = {
  disabled: 'Sincronización de equipo desactivada',
  pending: 'Eventos pendientes de enviar',
  offline: 'Sin conexión: eventos guardados localmente',
  syncing: 'Sincronizando equipo…',
  synced: 'Equipo sincronizado',
  error: 'No se pudo sincronizar el equipo',
};

export const REALTIME_STATUS_LABELS: Record<string, string> = {
  disabled: 'Tiempo real desactivado',
  connecting: 'Conectando al equipo…',
  connected: 'Tiempo real activo',
  error: 'Tiempo real no disponible',
};

export const LEVEL_OPTIONS: { value: DifficultyLevel; label: string }[] =
  DIFFICULTY_OPTIONS.map((option) => ({
    value: option.value,
    label: option.label,
  }));
