import type { NewInventoryLog } from '@/db/schema';
import { CIGARETTES_PER_PACK } from '@/shared/constants/app';
import type { InventoryActionType } from '@/shared/types/global';

export function packsToCigarettes(packs: number): number {
  return packs * CIGARETTES_PER_PACK;
}

export function parsePurchaseCost(cost: string): number | null {
  const trimmed = cost.trim();
  if (trimmed.length === 0) {
    return null;
  }
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

export interface InventoryLogInput {
  syncId: string;
  ownerUserId: string | null;
  timestamp: number;
  actionType: InventoryActionType;
  quantity: number;
  cost?: number | null;
}

export function buildInventoryLog(input: InventoryLogInput): NewInventoryLog {
  return {
    syncId: input.syncId,
    ownerUserId: input.ownerUserId,
    timestamp: new Date(input.timestamp).toISOString(),
    actionType: input.actionType,
    quantity: input.quantity,
    cost: input.cost ?? null,
  };
}
