import { DEFAULT_QUIT_GOAL } from '@/shared/constants/app';

import { buildProfileFromForm } from '../../utils/mappers';

describe('buildProfileFromForm', () => {
  const now = 1792400000000;

  it('maps numeric fields and an ISO creation date', () => {
    const result = buildProfileFromForm(
      {
        dailyCigarettes: '10',
        packCost: '5.50',
        currency: 'USD',
        quitGoal: 'Salud',
      },
      now,
    );

    expect(result.dailyCigarettes).toBe(10);
    expect(result.packCost).toBe(5.5);
    expect(result.currency).toBe('USD');
    expect(result.quitGoal).toBe('Salud');
    expect(result.createdAt).toBe(new Date(now).toISOString());
  });

  it('uses the default goal when the field is blank', () => {
    const result = buildProfileFromForm(
      {
        dailyCigarettes: '4',
        packCost: '0',
        currency: 'EUR',
        quitGoal: '   ',
      },
      now,
    );

    expect(result.quitGoal).toBe(DEFAULT_QUIT_GOAL);
  });
});
