import {
  generateInviteCode,
  isValidInviteCode,
  normalizeInviteCode,
} from '../../utils/inviteCodes';

describe('generateInviteCode', () => {
  it('generates a six-character uppercase alphanumeric code', () => {
    const code = generateInviteCode();

    expect(code).toHaveLength(6);
    expect(code).toMatch(/^[A-Z0-9]{6}$/);
  });
});

describe('normalizeInviteCode', () => {
  it('trims and uppercases input', () => {
    expect(normalizeInviteCode('  ab12cd ')).toBe('AB12CD');
  });
});

describe('isValidInviteCode', () => {
  it('accepts 4–12 alphanumeric characters after normalization', () => {
    expect(isValidInviteCode('ab12')).toBe(true);
    expect(isValidInviteCode('  ABC123 ')).toBe(true);
    expect(isValidInviteCode('A'.repeat(12))).toBe(true);
  });

  it('rejects malformed codes', () => {
    expect(isValidInviteCode('ABC')).toBe(false);
    expect(isValidInviteCode('A'.repeat(13))).toBe(false);
    expect(isValidInviteCode('AB-12')).toBe(false);
    expect(isValidInviteCode('')).toBe(false);
  });
});
