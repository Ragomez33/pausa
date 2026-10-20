import { useCallback, useEffect, useState } from 'react';

import {
  sendMagicLink,
  signOut as signOutAuth,
} from '@/shared/services/authService';
import {
  getBackupPreferences,
  setBackupEnabled,
  setEmotionConsent,
  type BackupPreferences,
} from '@/shared/services/syncPreferences';
import {
  adoptGuestData,
  enqueueUnsyncedPersonalData,
  hasGuestPersonalData,
} from '@/shared/services/personalBackfill';
import { useAuthSession } from '@/shared/hooks/useAuthSession';
import { usePersonalSync } from '@/shared/hooks/usePersonalSync';
import { usePersonalRestore } from '@/shared/hooks/usePersonalRestore';
import { showAppToast } from '@/shared/utils/toast';

import { ACCOUNT_TOASTS } from '../utils/constants';

export interface AccountBackupState {
  ready: boolean;
  authStatus: 'loading' | 'guest' | 'authenticated' | 'error';
  accountEmail: string | null;
  emailInput: string;
  preferences: BackupPreferences;
  backupStatus: ReturnType<typeof usePersonalSync>['status'];
  pendingCount: number;
  restoring: boolean;
  restoreProgress: string | null;
  adoptionNeeded: boolean;
  sendingLink: boolean;
  linkSent: boolean;
  updateEmail: (value: string) => void;
  requestMagicLink: () => Promise<void>;
  toggleBackup: () => void;
  toggleConsent: () => void;
  adoptLocalData: () => void;
  startWithCloudData: () => void;
  signOut: () => Promise<void>;
}

export function useAccountBackup(ready: boolean): AccountBackupState {
  const auth = useAuthSession(ready);
  const sync = usePersonalSync(ready);
  const [emailInput, setEmailInput] = useState('');
  const [preferences, setPreferences] = useState<BackupPreferences>(() =>
    getBackupPreferences(),
  );
  const [adoptionNeeded, setAdoptionNeeded] = useState(false);
  const [sendingLink, setSendingLink] = useState(false);
  const [linkSent, setLinkSent] = useState(false);
  const restore = usePersonalRestore(ready, preferences.backupEnabled);

  useEffect(() => {
    if (auth.status === 'authenticated' && !preferences.backupEnabled) {
      setAdoptionNeeded(hasGuestPersonalData());
    }
    if (auth.status === 'guest') {
      setAdoptionNeeded(false);
    }
  }, [auth.status, preferences.backupEnabled]);

  const requestMagicLink = useCallback(async (): Promise<void> => {
    if (emailInput.trim().length === 0 || sendingLink) {
      return;
    }
    setSendingLink(true);
    const result = await sendMagicLink(emailInput);
    setSendingLink(false);
    if (result.error !== null) {
      showAppToast({
        title: 'No se pudo enviar el enlace',
        description: result.error.message,
        action: 'error',
      });
      return;
    }
    setLinkSent(true);
    showAppToast({ title: ACCOUNT_TOASTS.magicLinkSent, action: 'success' });
  }, [emailInput, sendingLink]);

  const toggleBackup = useCallback((): void => {
    const next = !preferences.backupEnabled;
    if (!setBackupEnabled(next)) {
      showAppToast({
        title: 'Inicia sesión',
        description: ACCOUNT_TOASTS.signInRequired,
        action: 'warning',
      });
      return;
    }
    setPreferences(getBackupPreferences());
    showAppToast({
      title: next ? ACCOUNT_TOASTS.backupEnabled : ACCOUNT_TOASTS.backupDisabled,
      action: next ? 'success' : 'info',
    });
  }, [preferences.backupEnabled]);

  const toggleConsent = useCallback((): void => {
    const next = !preferences.consentEmotions;
    setEmotionConsent(next);
    setPreferences(getBackupPreferences());
    showAppToast({
      title: next ? ACCOUNT_TOASTS.consentEnabled : ACCOUNT_TOASTS.consentDisabled,
      action: 'info',
    });
  }, [preferences.consentEmotions]);

  const adoptLocalData = useCallback((): void => {
    if (auth.userId === null) {
      return;
    }
    adoptGuestData(auth.userId);
    setAdoptionNeeded(false);
    setPreferences(getBackupPreferences());
    if (getBackupPreferences().backupEnabled) {
      enqueueUnsyncedPersonalData(auth.userId);
    }
  }, [auth.userId]);

  const startWithCloudData = useCallback((): void => {
    setAdoptionNeeded(false);
    void restore.restore();
  }, [restore]);

  const signOut = useCallback(async (): Promise<void> => {
    await signOutAuth();
    setAdoptionNeeded(false);
    showAppToast({ title: ACCOUNT_TOASTS.signedOut, action: 'info' });
  }, []);

  const restoreProgress =
    restore.progress === null
      ? null
      : `${restore.progress.table} · ${restore.progress.processed}`;

  return {
    ready,
    authStatus: auth.status,
    accountEmail: auth.email,
    emailInput,
    preferences,
    backupStatus: sync.status,
    pendingCount: sync.pendingCount,
    restoring: restore.restoring,
    restoreProgress,
    adoptionNeeded,
    sendingLink,
    linkSent,
    updateEmail: setEmailInput,
    requestMagicLink,
    toggleBackup,
    toggleConsent,
    adoptLocalData,
    startWithCloudData,
    signOut,
  };
}
