import { createTeamSchema, joinTeamSchema } from '../../utils/schema';

describe('createTeamSchema', () => {
  const valid = {
    name: 'Los imparables',
    durationDays: '14',
    difficultyLevel: 'medio',
  };

  it('accepts a valid team', () => {
    expect(createTeamSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects short or missing names', () => {
    expect(createTeamSchema.safeParse({ ...valid, name: 'A' }).success).toBe(false);
    expect(createTeamSchema.safeParse({ ...valid, name: '' }).success).toBe(false);
  });

  it('rejects zero, negative, fractional, or non-numeric durations', () => {
    for (const durationDays of ['0', '-1', '1.5', 'abc', '']) {
      expect(createTeamSchema.safeParse({ ...valid, durationDays }).success).toBe(false);
    }
  });

  it('rejects an invalid level', () => {
    expect(
      createTeamSchema.safeParse({ ...valid, difficultyLevel: 'imposible' }).success,
    ).toBe(false);
  });
});

describe('joinTeamSchema', () => {
  it('normalizes a valid code', () => {
    const result = joinTeamSchema.safeParse({ inviteCode: '  ab12cd ' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.inviteCode).toBe('AB12CD');
    }
  });

  it('rejects malformed codes', () => {
    expect(joinTeamSchema.safeParse({ inviteCode: 'AB' }).success).toBe(false);
    expect(joinTeamSchema.safeParse({ inviteCode: 'AB-12' }).success).toBe(false);
  });
});
