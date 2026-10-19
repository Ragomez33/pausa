import { useCallback, useEffect, useRef, useState } from 'react';

import { getProfile } from '@/db/queries';
import type { UserProfile } from '@/db/schema';
import { showAppToast } from '@/shared/utils/toast';

import { calculateDailyLimit, type DifficultyLevel } from '../utils/difficulty';
import { createTeamSchema } from '../utils/schema';
import { createTeamWithLeader } from '../utils/service';

export interface CreateTeamFormState {
  name: string;
  durationDays: string;
  difficultyLevel: DifficultyLevel;
}

export interface UseCreateTeamResult {
  profile: UserProfile | null;
  form: CreateTeamFormState;
  submitting: boolean;
  previewLimit: number;
  updateForm: (patch: Partial<CreateTeamFormState>) => void;
  submit: () => boolean;
}

export function useCreateTeam(): UseCreateTeamResult {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [form, setForm] = useState<CreateTeamFormState>({
    name: '',
    durationDays: '14',
    difficultyLevel: 'medio',
  });
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  useEffect(() => {
    try {
      setProfile(getProfile());
    } catch {
      setProfile(null);
    }
  }, []);

  const updateForm = useCallback((patch: Partial<CreateTeamFormState>): void => {
    setForm((previous) => ({ ...previous, ...patch }));
  }, []);

  const submit = useCallback((): boolean => {
    if (submittingRef.current || profile === null) {
      return false;
    }

    const parsed = createTeamSchema.safeParse(form);
    if (!parsed.success) {
      showAppToast({
        title: 'Revisa los datos',
        description: parsed.error.issues[0]?.message ?? 'Datos inválidos',
        action: 'error',
      });
      return false;
    }

    submittingRef.current = true;
    setSubmitting(true);
    const result = createTeamWithLeader({
      name: parsed.data.name,
      difficultyLevel: parsed.data.difficultyLevel,
      durationDays: Number(parsed.data.durationDays),
      dailyCigarettes: profile.dailyCigarettes,
    });
    setSubmitting(false);

    if (result.error !== null) {
      submittingRef.current = false;
      setSubmitting(false);
      showAppToast({
        title: 'No se pudo crear el equipo',
        description: result.error.message,
        action: 'error',
      });
      return false;
    }

    showAppToast({
      title: 'Equipo creado',
      description: `Código: ${result.team?.inviteCode ?? ''}`,
      action: 'success',
    });
    return true;
  }, [form, profile]);

  return {
    profile,
    form,
    submitting,
    previewLimit:
      profile !== null
        ? calculateDailyLimit(profile.dailyCigarettes, form.difficultyLevel)
        : 0,
    updateForm,
    submit,
  };
}
