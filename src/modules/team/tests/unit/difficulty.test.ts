import { calculateDailyLimit, getDifficultyLabel } from '../../utils/difficulty';

describe('calculateDailyLimit', () => {
  it('applies each level multiplier', () => {
    expect(calculateDailyLimit(20, 'facil')).toBe(20);
    expect(calculateDailyLimit(20, 'medio')).toBe(15);
    expect(calculateDailyLimit(20, 'dificil')).toBe(10);
    expect(calculateDailyLimit(20, 'modo_dios')).toBe(5);
  });

  it('floors fractional results', () => {
    expect(calculateDailyLimit(15, 'medio')).toBe(11);
    expect(calculateDailyLimit(7, 'dificil')).toBe(3);
  });

  it('returns zero for invalid profiles', () => {
    expect(calculateDailyLimit(0, 'facil')).toBe(0);
    expect(calculateDailyLimit(-3, 'medio')).toBe(0);
    expect(calculateDailyLimit(Number.NaN, 'dificil')).toBe(0);
  });
});

describe('getDifficultyLabel', () => {
  it('returns the Spanish label', () => {
    expect(getDifficultyLabel('facil')).toBe('Fácil');
    expect(getDifficultyLabel('modo_dios')).toBe('Modo Dios');
  });
});
