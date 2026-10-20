import {
  canEnqueueForScope,
  isGuestScope,
  matchesActiveScope,
  resolveScopeUserId,
} from '../../utils/accountScope';

describe('accountScope', () => {
  it('treats null and guest as the guest scope', () => {
    expect(isGuestScope(null)).toBe(true);
    expect(isGuestScope('guest')).toBe(true);
    expect(isGuestScope('user-1')).toBe(false);
  });

  it('matches guest rows only to the guest scope', () => {
    expect(matchesActiveScope(null, 'guest')).toBe(true);
    expect(matchesActiveScope('user-1', 'guest')).toBe(false);
    expect(matchesActiveScope('user-1', 'user-1')).toBe(true);
    expect(matchesActiveScope('user-2', 'user-1')).toBe(false);
  });

  it('never enqueues guest or cross-account rows', () => {
    expect(canEnqueueForScope('user-1', 'user-1')).toBe(true);
    expect(canEnqueueForScope('user-2', 'user-1')).toBe(false);
    expect(canEnqueueForScope(null, 'guest')).toBe(false);
  });

  it('resolves the owner id for a scope', () => {
    expect(resolveScopeUserId('guest')).toBeNull();
    expect(resolveScopeUserId('user-1')).toBe('user-1');
  });
});
