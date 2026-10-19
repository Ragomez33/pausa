import type { InventoryLog } from '@/db/schema';
import { CIGARETTES_PER_PACK, LOW_STOCK_DAYS } from '@/shared/constants/app';
import type { InventorySummary } from '@/shared/types/global';

export function computeInventorySummary(
  logs: InventoryLog[],
  dailyCigarettes: number,
  currency = 'USD',
): InventorySummary {
  let totalPurchased = 0;
  let totalConsumed = 0;
  let totalSpending = 0;

  for (const log of logs) {
    if (log.actionType === 'purchase') {
      totalPurchased += log.quantity;
      if (log.cost !== null && Number.isFinite(log.cost)) {
        totalSpending += log.cost;
      }
      continue;
    }
    if (log.actionType === 'consumption') {
      totalConsumed += log.quantity;
    }
  }

  const stock = Math.max(0, totalPurchased - totalConsumed);
  const packs = Math.floor(stock / CIGARETTES_PER_PACK);
  const safeDaily = Number.isFinite(dailyCigarettes) && dailyCigarettes > 0 ? dailyCigarettes : 0;
  const daysRemaining = safeDaily > 0 ? stock / safeDaily : null;
  const lowStock =
    stock <= 0 || (daysRemaining !== null && daysRemaining <= LOW_STOCK_DAYS);

  return {
    totalPurchased,
    totalConsumed,
    stock,
    packs,
    daysRemaining,
    lowStock,
    totalSpending,
    currency,
  };
}
