import type { NewUserProfile } from '@/db/schema';
import { DEFAULT_QUIT_GOAL } from '@/shared/constants/app';
import type { ProfileFormValues } from '@/shared/types/global';

export function buildProfileFromForm(
  values: ProfileFormValues,
  now: number,
): NewUserProfile {
  const trimmedGoal = values.quitGoal.trim();

  return {
    dailyCigarettes: Number(values.dailyCigarettes),
    packCost: Number(values.packCost),
    currency: values.currency.trim(),
    quitGoal: trimmedGoal.length > 0 ? trimmedGoal : DEFAULT_QUIT_GOAL,
    createdAt: new Date(now).toISOString(),
  };
}
