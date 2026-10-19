import type { InventoryLog } from '@/db/schema';

import { computeInventorySummary } from '../../utils/inventory';

function log(
  id: number,
  actionType: 'purchase' | 'consumption',
  quantity: number,
  cost: number | null = null,
): InventoryLog {
  return {
    id,
    timestamp: new Date(id * 1_000).toISOString(),
    actionType,
    quantity,
    cost,
  };
}

describe('computeInventorySummary', () => {
  it('returns an empty summary with low stock when there are no logs', () => {
    const summary = computeInventorySummary([], 10);

    expect(summary.totalPurchased).toBe(0);
    expect(summary.totalConsumed).toBe(0);
    expect(summary.stock).toBe(0);
    expect(summary.packs).toBe(0);
    expect(summary.daysRemaining).toBe(0);
    expect(summary.lowStock).toBe(true);
    expect(summary.totalSpending).toBe(0);
  });

  it('computes stock, full packs, and days remaining', () => {
    const summary = computeInventorySummary(
      [log(3, 'purchase', 20, 5), log(2, 'purchase', 20, 5), log(1, 'consumption', 15)],
      10,
    );

    expect(summary.totalPurchased).toBe(40);
    expect(summary.totalConsumed).toBe(15);
    expect(summary.stock).toBe(25);
    expect(summary.packs).toBe(1);
    expect(summary.daysRemaining).toBeCloseTo(2.5);
    expect(summary.lowStock).toBe(true);
  });

  it('floors pack counts and keeps more than 3 days out of low stock', () => {
    const summary = computeInventorySummary([log(1, 'purchase', 45)], 10);

    expect(summary.stock).toBe(45);
    expect(summary.packs).toBe(2);
    expect(summary.daysRemaining).toBeCloseTo(4.5);
    expect(summary.lowStock).toBe(false);
  });

  it('treats exactly 3 days as low stock', () => {
    const summary = computeInventorySummary([log(1, 'purchase', 30)], 10);

    expect(summary.daysRemaining).toBe(3);
    expect(summary.lowStock).toBe(true);
  });

  it('does not warn for non-empty stock when daily consumption is zero', () => {
    const summary = computeInventorySummary([log(1, 'purchase', 20)], 0);

    expect(summary.daysRemaining).toBeNull();
    expect(summary.lowStock).toBe(false);
  });

  it('never returns negative stock', () => {
    const summary = computeInventorySummary(
      [log(2, 'purchase', 10), log(1, 'consumption', 50)],
      10,
    );

    expect(summary.stock).toBe(0);
    expect(summary.packs).toBe(0);
    expect(summary.lowStock).toBe(true);
  });

  it('sums only provided purchase costs', () => {
    const summary = computeInventorySummary(
      [
        log(4, 'purchase', 20, 5.5),
        log(3, 'purchase', 20, null),
        log(2, 'purchase', 20, 3),
        log(1, 'consumption', 10, 99),
      ],
      10,
    );

    expect(summary.totalSpending).toBeCloseTo(8.5);
  });
});
