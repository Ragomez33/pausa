import { consumptionSchema, purchaseSchema } from '../../utils/schema';

describe('purchaseSchema', () => {
  it('accepts a positive whole pack count and an optional cost', () => {
    expect(purchaseSchema.safeParse({ packs: '2', cost: '5.50' }).success).toBe(true);
    expect(purchaseSchema.safeParse({ packs: '1', cost: '' }).success).toBe(true);
    expect(purchaseSchema.safeParse({ packs: '3', cost: '0' }).success).toBe(true);
  });

  it('rejects empty, zero, negative, fractional, or non-numeric pack counts', () => {
    for (const packs of ['', '0', '-1', '1.5', 'abc']) {
      expect(purchaseSchema.safeParse({ packs, cost: '' }).success).toBe(false);
    }
  });

  it('rejects a negative or non-numeric cost', () => {
    expect(purchaseSchema.safeParse({ packs: '2', cost: '-1' }).success).toBe(false);
    expect(purchaseSchema.safeParse({ packs: '2', cost: 'abc' }).success).toBe(false);
  });
});

describe('consumptionSchema', () => {
  it('accepts a positive whole cigarette count', () => {
    expect(consumptionSchema.safeParse({ cigarettes: '10' }).success).toBe(true);
  });

  it('rejects empty, zero, negative, fractional, or non-numeric counts', () => {
    for (const cigarettes of ['', '0', '-1', '1.5', 'abc']) {
      expect(consumptionSchema.safeParse({ cigarettes }).success).toBe(false);
    }
  });
});
