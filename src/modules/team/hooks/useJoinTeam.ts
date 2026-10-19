import { useCallback, useEffect, useRef, useState } from 'react';

import { getProfile } from '@/db/queries';
import type { UserProfile } from '@/db/schema';
import { showAppToast } from '@/shared/utils/toast';

import { joinTeamSchema } from '../utils/schema';
import { joinTeamByInviteCode } from '../utils/service';

export interface UseJoinTeamResult {
  profile: UserProfile | null;
  inviteCode: string;
  submitting: boolean;
  setInviteCode: (code: string) => void;
  submit: () => boolean;
}

export function useJoinTeam(): UseJoinTeamResult {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [inviteCode, setInviteCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  useEffect(() => {
    try {
      setProfile(getProfile());
    } catch {
      setProfile(null);
    }
  }, []);

  const submit = useCallback((): boolean => {
    if (submittingRef.current || profile === null) {
      return false;
    }

    const parsed = joinTeamSchema.safeParse({ inviteCode });
    if (!parsed.success) {
      showAppToast({
        title: 'Código inválido',
        description: parsed.error.issues[0]?.message ?? 'Revisa el código',
        action: 'error',
      });
      return false;
    }

    submittingRef.current = true;
    setSubmitting(true);
    const result = joinTeamByInviteCode({
      inviteCode: parsed.data.inviteCode,
      dailyCigarettes: profile.dailyCigarettes,
    });
    setSubmitting(false);

    if (result.error !== null) {
      submittingRef.current = false;
      setSubmitting(false);
      showAppToast({
        title: 'No se pudo unir',
        description: result.error.message,
        action: 'error',
      });
      return false;
    }

    showAppToast({
      title: result.alreadyMember ? 'Ya perteneces a este equipo' : 'Te uniste al equipo',
      description: result.team?.name,
      action: result.alreadyMember ? 'info' : 'success',
    });
    return true;
  }, [inviteCode, profile]);

  return { profile, inviteCode, submitting, setInviteCode, submit };
}
