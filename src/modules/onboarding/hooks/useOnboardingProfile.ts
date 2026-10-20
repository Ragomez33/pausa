import { useCallback, useState } from 'react';

import { db } from '@/db/client';
import { getProfile, getScopedOwnerUserId } from '@/db/queries';
import { userProfile } from '@/db/schema';
import { enqueuePersonalSync } from '@/shared/services/syncEngine';
import { getBackupPreferences } from '@/shared/services/syncPreferences';
import { buildProfileSyncPayload } from '@/shared/utils/personalSyncPayloads';
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

    const payload = buildProfileFromForm(
      parsed.data,
      Date.now(),
      getScopedOwnerUserId(),
    );

    try {
      const created = db.insert(userProfile).values(payload).returning().get();
      const ownerUserId = payload.ownerUserId;
      if (typeof ownerUserId === 'string' && getBackupPreferences().backupEnabled) {
        enqueuePersonalSync(
          'profile',
          ownerUserId,
          buildProfileSyncPayload(created, ownerUserId),
        );
      }
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
