import { useCallback, useState } from 'react';

import { saveProfile } from '@/shared/db/queries';
import type { ProfileFormValues } from '@/shared/types/global';
import { showAppToast } from '@/shared/utils/toast';

import { buildProfileFromForm } from '../utils/mappers';
import { onboardingSchema } from '../utils/schema';

export interface UseOnboardingProfileResult {
  submitting: boolean;
  submit: (values: ProfileFormValues) => boolean;
}

export function useOnboardingProfile(): UseOnboardingProfileResult {
  const [submitting, setSubmitting] = useState(false);

  const submit = useCallback((values: ProfileFormValues): boolean => {
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
      saveProfile(buildProfileFromForm(parsed.data, Date.now()));
    } catch {
      setSubmitting(false);
      showAppToast({
        title: 'No se pudo guardar',
        description: 'Inténtalo de nuevo.',
        action: 'error',
      });
      return false;
    }
    setSubmitting(false);
    return true;
  }, []);

  return { submitting, submit };
}
