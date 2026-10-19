import { getTriggerLabel } from '@/shared/utils/triggers';

describe('getTriggerLabel', () => {
  it('maps current trigger codes', () => {
    expect(getTriggerLabel('anxiety')).toBe('Ansiedad');
    expect(getTriggerLabel('stress')).toBe('Estrés');
    expect(getTriggerLabel('boredom')).toBe('Aburrimiento');
    expect(getTriggerLabel('habit_social')).toBe('Hábito/Social');
    expect(getTriggerLabel('anger_frustration')).toBe('Ira/Frustración');
  });

  it('maps legacy trigger codes', () => {
    expect(getTriggerLabel('work_stress')).toBe('Estrés laboral');
    expect(getTriggerLabel('coffee_social')).toBe('Café/Social');
    expect(getTriggerLabel('other')).toBe('Otro');
  });

  it('returns a readable fallback for unknown codes', () => {
    expect(getTriggerLabel('night_craving')).toBe('Night craving');
    expect(getTriggerLabel('night_craving')).not.toContain('_');
  });

  it('handles empty codes', () => {
    expect(getTriggerLabel('')).toBe('Otro');
  });
});
