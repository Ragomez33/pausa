import { TRANSFORMATION_MESSAGES } from './constants';

export function getFeedbackMessage(feedback: string | undefined): string | null {
  if (feedback === 'resisted' || feedback === 'ceded') {
    return TRANSFORMATION_MESSAGES[feedback];
  }
  return null;
}
