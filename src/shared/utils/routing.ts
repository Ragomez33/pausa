export function shouldRedirectToOnboarding(
  hasProfile: boolean,
  segments: readonly string[],
): boolean {
  return !hasProfile && segments[0] !== 'onboarding';
}
