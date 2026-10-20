import { GUEST_SCOPE } from '@/shared/constants/sync';

export function isGuestScope(scope: string | null): boolean {
  return scope === null || scope === GUEST_SCOPE || scope.length === 0;
}

export function matchesActiveScope(
  ownerUserId: string | null,
  activeScope: string | null,
): boolean {
  if (isGuestScope(activeScope)) {
    return ownerUserId === null;
  }
  return ownerUserId === activeScope;
}

export function resolveScopeUserId(scope: string | null): string | null {
  return isGuestScope(scope) ? null : scope;
}

export function canEnqueueForScope(
  ownerUserId: string | null,
  activeScope: string | null,
): boolean {
  return matchesActiveScope(ownerUserId, activeScope) && !isGuestScope(activeScope);
}
