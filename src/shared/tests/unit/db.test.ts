import {
  buildSmokeLogFromAction,
  buildSupplyInventoryFromPurchase,
} from '../../../db/mappers';

describe('buildSmokeLogFromAction', () => {
  it('maps a smoked action to a persisted smoke log', () => {
    const result = buildSmokeLogFromAction({
      occurredAt: 1000,
      postponed: false,
      reason: 'ansiedad',
    });

    expect(result.createdAt).toBe(1000);
    expect(result.postponed).toBe(0);
    expect(result.reason).toBe('ansiedad');
  });

  it('maps a postponed action and defaults optional fields to null', () => {
    const result = buildSmokeLogFromAction({
      occurredAt: 2000,
      postponed: true,
    });

    expect(result.postponed).toBe(1);
    expect(result.reason).toBeNull();
    expect(result.notes).toBeNull();
  });
});

describe('buildSupplyInventoryFromPurchase', () => {
  it('derives remaining cigarettes from packs and pack size', () => {
    const result = buildSupplyInventoryFromPurchase({
      purchasedAt: 5000,
      packCount: 3,
      cigarettesPerPack: 20,
    });

    expect(result.remainingCigarettes).toBe(60);
    expect(result.notes).toBeNull();
  });
});
