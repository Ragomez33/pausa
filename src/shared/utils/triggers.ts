import { TRIGGER_LABELS } from '@/shared/constants/triggers';

export function getTriggerLabel(code: string): string {
  const known = TRIGGER_LABELS[code];
  if (known !== undefined) {
    return known;
  }

  const normalized = code.replace(/_/g, ' ').trim();
  if (normalized.length === 0) {
    return 'Otro';
  }
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}
