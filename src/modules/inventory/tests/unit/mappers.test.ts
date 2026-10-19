import { buildInventoryLog, packsToCigarettes, parsePurchaseCost } from '../../utils/mappers';

describe('packsToCigarettes', () => {
  it('converts packs using 20 cigarettes per pack', () => {
    expect(packsToCigarettes(1)).toBe(20);
    expect(packsToCigarettes(2)).toBe(40);
  });
});

describe('parsePurchaseCost', () => {
  it('returns null for an empty cost', () => {
    expect(parsePurchaseCost('')).toBeNull();
    expect(parsePurchaseCost('   ')).toBeNull();
  });

  it('parses a non-negative numeric cost', () => {
    expect(parsePurchaseCost('5.50')).toBe(5.5);
    expect(parsePurchaseCost('0')).toBe(0);
  });

  it('returns null for invalid or negative values', () => {
    expect(parsePurchaseCost('abc')).toBeNull();
    expect(parsePurchaseCost('-1')).toBeNull();
  });
});

describe('buildInventoryLog', () => {
  it('builds a purchase log with an ISO timestamp and cost', () => {
    const result = buildInventoryLog({
      timestamp: 1_000,
      actionType: 'purchase',
      quantity: 40,
      cost: 5,
    });

    expect(result.timestamp).toBe(new Date(1_000).toISOString());
    expect(result.actionType).toBe('purchase');
    expect(result.quantity).toBe(40);
    expect(result.cost).toBe(5);
  });

  it('stores null cost when omitted', () => {
    const result = buildInventoryLog({
      timestamp: 2_000,
      actionType: 'purchase',
      quantity: 20,
    });

    expect(result.cost).toBeNull();
  });

  it('builds a consumption log with null cost', () => {
    const result = buildInventoryLog({
      timestamp: 3_000,
      actionType: 'consumption',
      quantity: 10,
      cost: null,
    });

    expect(result.actionType).toBe('consumption');
    expect(result.quantity).toBe(10);
    expect(result.cost).toBeNull();
  });
});
