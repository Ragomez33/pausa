import { onboardingSchema } from '../../utils/schema';

describe('onboardingSchema', () => {
  const valid = {
    dailyCigarettes: '10',
    packCost: '5.50',
    currency: 'USD',
    quitGoal: 'Salud',
  };

  it('accepts valid onboarding values', () => {
    const result = onboardingSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('rejects an empty daily cigarette count', () => {
    const result = onboardingSchema.safeParse({ ...valid, dailyCigarettes: '' });
    expect(result.success).toBe(false);
  });

  it('rejects a non-numeric daily cigarette count', () => {
    const result = onboardingSchema.safeParse({ ...valid, dailyCigarettes: 'abc' });
    expect(result.success).toBe(false);
  });

  it('rejects a zero daily cigarette count', () => {
    const result = onboardingSchema.safeParse({ ...valid, dailyCigarettes: '0' });
    expect(result.success).toBe(false);
  });

  it('rejects a negative pack cost', () => {
    const result = onboardingSchema.safeParse({ ...valid, packCost: '-1' });
    expect(result.success).toBe(false);
  });

  it('accepts a zero pack cost', () => {
    const result = onboardingSchema.safeParse({ ...valid, packCost: '0' });
    expect(result.success).toBe(true);
  });

  it('rejects a missing currency', () => {
    const result = onboardingSchema.safeParse({ ...valid, currency: '' });
    expect(result.success).toBe(false);
  });
});
