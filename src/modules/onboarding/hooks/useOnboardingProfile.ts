import { useCallback, useState } from 'react';

import { db } from '@/db/client';
import { getProfile } from '@/db/queries';
import { userProfile } from '@/db/schema';
import type { ProfileFormValues } from '@/shared/types/global';
import { showAppToast } from '@/shared/utils/toast';

import { buildProfileFromForm } from '../utils/mappers';
import { onboardingSchema } from '../utils/schema';

export interface UseOnboardingProfileResult {
  submitting: boolean;
  submit: (values: ProfileFormValues) => Promise<boolean>;
}

export function useOnboardingProfile(): UseOnboardingProfileResult {
  const [submitting, setSubmitting] = useState(false);

  const submit = useCallback(async (values: ProfileFormValues): Promise<boolean> => {
    const parsed = onboardingSchema.safeParse(values);
    if (!parsed.success) {
      showAppToast({
        title: 'Revisa los datos',
        description: parsed.error.issues[0]?.message ?? 'Datos inválidos',
        action: 'error',
      });
      return false;
    }

    setSubmitting(true);

    try {
      if (getProfile() !== null) {
        setSubmitting(false);
        return true;
      }
    } catch {
      setSubmitting(false);
      showAppToast({
        title: 'No se pudo guardar',
        description: 'Inténtalo de nuevo.',
        action: 'error',
      });
      return false;
    }

    const payload = buildProfileFromForm(parsed.data, Date.now());

    try {
      db.insert(userProfile).values(payload).returning().get();
    } catch {
      showAppToast({
        title: 'No se pudo guardar',
        description: 'Inténtalo de nuevo.',
        action: 'error',
      });
      return false;
    } finally {
      setSubmitting(false);
    }

    return true;
  }, []);

  return { submitting, submit };
}
