import { shouldRedirectToOnboarding } from '../../utils/routing';

describe('shouldRedirectToOnboarding', () => {
  it('redirects when no profile exists and the app is not on onboarding', () => {
    expect(shouldRedirectToOnboarding(false, ['index'])).toBe(true);
  });

  it('does not redirect when already on onboarding', () => {
    expect(shouldRedirectToOnboarding(false, ['onboarding'])).toBe(false);
  });

  it('does not redirect when a profile exists', () => {
    expect(shouldRedirectToOnboarding(true, ['index'])).toBe(false);
    expect(shouldRedirectToOnboarding(true, ['onboarding'])).toBe(false);
  });
});
