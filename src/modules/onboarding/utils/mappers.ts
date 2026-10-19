import type { NewUserProfile } from '@/shared/db/schema';
import type { ProfileFormValues } from '@/shared/types/global';

export function buildProfileFromForm(
  values: ProfileFormValues,
  now: number,
): NewUserProfile {
  return {
    dailyCigarettes: Number(values.dailyCigarettes),
    packCost: Number(values.packCost),
    currency: values.currency,
    quitGoal: values.quitGoal.trim().length > 0 ? values.quitGoal.trim() : null,
    createdAt: now,
    updatedAt: now,
  };
}
