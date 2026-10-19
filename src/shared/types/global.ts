export type UnixMillis = number;

export type ActiveModal = 'NONE' | 'BUY_SUPPLY' | 'CONFIRM_SMOKE' | 'GOAL_SETTINGS';

export type InventoryActionType = 'purchase' | 'consumption';

export type TriggerEmotion =
  | 'anxiety'
  | 'stress'
  | 'boredom'
  | 'habit_social'
  | 'anger_frustration';

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
  cededCount: number;
  elapsedMs: number;
  streakStart: string;
  avoidedCigarettes: number;
  moneySaved: number;
  inventorySpending: number;
  currency: string;
}

export interface PauseTotals {
  total: number;
  resisted: number;
  ceded: number;
}

export interface TriggerCount {
  triggerEmotion: string;
  count: number;
}

export interface InventorySummary {
  totalPurchased: number;
  totalConsumed: number;
  stock: number;
  packs: number;
  daysRemaining: number | null;
  lowStock: boolean;
  totalSpending: number;
  currency: string;
}

export interface AppToastOptions {
  title: string;
  description?: string;
  action?: 'success' | 'error' | 'warning' | 'info';
}
