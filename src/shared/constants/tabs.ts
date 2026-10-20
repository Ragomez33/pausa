import { Clock3, House, Package, Trophy, Users } from '@/shared/components/icons';
import type { LucideIcon } from '@/shared/components/icons';

export type MainTabKey = 'home' | 'history' | 'inventory' | 'badges' | 'team';

export interface MainTab {
  key: MainTabKey;
  label: string;
  route: '/' | '/history' | '/inventory' | '/badges' | '/team';
  icon: LucideIcon;
}

export const MAIN_TABS: readonly MainTab[] = [
  { key: 'home', label: 'Inicio', route: '/', icon: House },
  { key: 'history', label: 'Historial', route: '/history', icon: Clock3 },
  { key: 'inventory', label: 'Inventario', route: '/inventory', icon: Package },
  { key: 'badges', label: 'Logros', route: '/badges', icon: Trophy },
  { key: 'team', label: 'Equipo', route: '/team', icon: Users },
];
