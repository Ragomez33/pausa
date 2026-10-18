export type UnixMillis = number;

export type ActiveModal = 'NONE' | 'BUY_SUPPLY' | 'CONFIRM_SMOKE' | 'GOAL_SETTINGS';

export interface DatabaseStatus {
  ready: boolean;
  error: Error | null;
}

export interface AppToastOptions {
  title: string;
  description?: string;
  action?: 'success' | 'error' | 'warning' | 'info';
}
