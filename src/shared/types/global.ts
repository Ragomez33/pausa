export type UnixMillis = number;

export type ActiveModal = 'NONE' | 'BUY_SUPPLY' | 'CONFIRM_SMOKE' | 'GOAL_SETTINGS';

export type TriggerEmotion =
  | 'anxiety'
  | 'work_stress'
  | 'coffee_social'
  | 'boredom'
  | 'other';

export interface DatabaseStatus {
  ready: boolean;
  hasProfile: boolean;
  error: Error | null;
}

export interface DatabaseInitializedState extends DatabaseStatus {
  refresh: () => void;
}

export interface ProfileFormValues {
  dailyCigarettes: string;
  packCost: string;
  currency: string;
  quitGoal: string;
}

export interface HomeMetrics {
  resistedCount: number;
  currentStreak: number;
  moneySaved: number;
  currency: string;
}

export interface AppToastOptions {
  title: string;
  description?: string;
  action?: 'success' | 'error' | 'warning' | 'info';
}
