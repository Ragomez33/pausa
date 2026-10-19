import { getFeedbackMessage } from '../../utils/feedback';
import { TRANSFORMATION_MESSAGES } from '../../utils/constants';

describe('getFeedbackMessage', () => {
  it('returns the resisting reinforcement message', () => {
    expect(getFeedbackMessage('resisted')).toBe(TRANSFORMATION_MESSAGES.resisted);
  });

  it('returns the ceded restart message', () => {
    expect(getFeedbackMessage('ceded')).toBe(TRANSFORMATION_MESSAGES.ceded);
  });

  it('returns null for missing or unknown feedback', () => {
    expect(getFeedbackMessage(undefined)).toBeNull();
    expect(getFeedbackMessage('other')).toBeNull();
  });
});
