import type { NewSmokeLog, NewSupplyInventoryItem } from './schema';

export interface SmokeLogAction {
  reason?: string;
  postponed: boolean;
  notes?: string;
  occurredAt: number;
}

export function buildSmokeLogFromAction(action: SmokeLogAction): NewSmokeLog {
  return {
    createdAt: action.occurredAt,
    reason: action.reason ?? null,
    postponed: action.postponed ? 1 : 0,
    notes: action.notes ?? null,
  };
}

export interface SupplyPurchaseAction {
  purchasedAt: number;
  packCount: number;
  cigarettesPerPack: number;
  notes?: string;
}

export function buildSupplyInventoryFromPurchase(
  action: SupplyPurchaseAction,
): NewSupplyInventoryItem {
  return {
    purchasedAt: action.purchasedAt,
    packCount: action.packCount,
    cigarettesPerPack: action.cigarettesPerPack,
    remainingCigarettes: action.packCount * action.cigarettesPerPack,
    notes: action.notes ?? null,
  };
}
