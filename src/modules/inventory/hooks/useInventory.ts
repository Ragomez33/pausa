import { useCallback, useRef, useState } from 'react';

import { useFocusEffect } from 'expo-router';

import {
  createInventoryLog,
  getProfile,
  getScopedOwnerUserId,
  listInventoryLogs,
  recordInventoryConsumption,
} from '@/db/queries';
import { enqueueTeamSharedEvent } from '@/modules/team/sync/teamSync';
import type { InventorySummary } from '@/shared/types/global';
import { computeInventorySummary } from '@/shared/utils/inventory';
import { resetIdleNotificationFromProfile } from '@/shared/utils/notifications';
import { enqueuePersonalSync } from '@/shared/services/syncEngine';
import { getBackupPreferences } from '@/shared/services/syncPreferences';
import {
  buildInventorySyncPayload,
  buildSmokingSyncPayload,
} from '@/shared/utils/personalSyncPayloads';
import { createSyncId } from '@/shared/utils/syncIds';
import { showAppToast } from '@/shared/utils/toast';

import type { InventoryFormMode } from '../utils/constants';
import { buildInventoryLog, packsToCigarettes, parsePurchaseCost } from '../utils/mappers';
import { consumptionSchema, purchaseSchema } from '../utils/schema';

export interface InventoryFormState {
  mode: InventoryFormMode;
  packs: string;
  cost: string;
  cigarettes: string;
}

interface InventoryState {
  loading: boolean;
  hasProfile: boolean;
  summary: InventorySummary | null;
  error: Error | null;
}

const EMPTY_FORM: InventoryFormState = {
  mode: 'none',
  packs: '',
  cost: '',
  cigarettes: '',
};

export interface UseInventoryResult {
  loading: boolean;
  hasProfile: boolean;
  summary: InventorySummary | null;
  error: Error | null;
  form: InventoryFormState;
  saving: boolean;
  refresh: () => void;
  openPurchase: () => void;
  openConsumption: () => void;
  closeForm: () => void;
  updateForm: (patch: Partial<InventoryFormState>) => void;
  submitPurchase: () => boolean;
  submitConsumption: () => boolean;
}

export function useInventory(): UseInventoryResult {
  const [state, setState] = useState<InventoryState>({
    loading: true,
    hasProfile: false,
    summary: null,
    error: null,
  });
  const [form, setForm] = useState<InventoryFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);

  const load = useCallback((): void => {
    try {
      const profile = getProfile();
      if (profile === null) {
        setState({ loading: false, hasProfile: false, summary: null, error: null });
        return;
      }
      const logs = listInventoryLogs();
      setState({
        loading: false,
        hasProfile: true,
        summary: computeInventorySummary(logs, profile.dailyCigarettes, profile.currency),
        error: null,
      });
    } catch (caught) {
      setState({
        loading: false,
        hasProfile: false,
        summary: null,
        error: caught instanceof Error ? caught : new Error('Error de base de datos'),
      });
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const openPurchase = useCallback((): void => {
    setForm({ ...EMPTY_FORM, mode: 'purchase' });
  }, []);

  const openConsumption = useCallback((): void => {
    setForm({ ...EMPTY_FORM, mode: 'consumption' });
  }, []);

  const closeForm = useCallback((): void => {
    setForm(EMPTY_FORM);
  }, []);

  const updateForm = useCallback((patch: Partial<InventoryFormState>): void => {
    setForm((previous) => ({ ...previous, ...patch }));
  }, []);

  const submitPurchase = useCallback((): boolean => {
    if (savingRef.current) {
      return false;
    }

    const parsed = purchaseSchema.safeParse({ packs: form.packs, cost: form.cost });
    if (!parsed.success) {
      showAppToast({
        title: 'Revisa los datos',
        description: parsed.error.issues[0]?.message ?? 'Datos inválidos',
        action: 'error',
      });
      return false;
    }

    savingRef.current = true;
    setSaving(true);

    const payload = buildInventoryLog({
      syncId: createSyncId(),
      ownerUserId: getScopedOwnerUserId(),
      timestamp: Date.now(),
      actionType: 'purchase',
      quantity: packsToCigarettes(Number(parsed.data.packs)),
      cost: parsePurchaseCost(parsed.data.cost),
    });

    try {
      const createdLog = createInventoryLog(payload);
      const ownerUserId = getScopedOwnerUserId();
      if (ownerUserId !== null) {
        enqueuePersonalSync(
          'inventory_log',
          createdLog.syncId,
          buildInventorySyncPayload(createdLog, ownerUserId),
        );
      }
    } catch {
      savingRef.current = false;
      setSaving(false);
      showAppToast({
        title: 'No se pudo guardar',
        description: 'Inténtalo de nuevo.',
        action: 'error',
      });
      return false;
    }

    savingRef.current = false;
    setSaving(false);
    setForm(EMPTY_FORM);
    load();
    showAppToast({ title: 'Compra registrada', action: 'success' });
    return true;
  }, [form, load]);

  const submitConsumption = useCallback((): boolean => {
    if (savingRef.current) {
      return false;
    }

    const parsed = consumptionSchema.safeParse({ cigarettes: form.cigarettes });
    if (!parsed.success) {
      showAppToast({
        title: 'Revisa los datos',
        description: parsed.error.issues[0]?.message ?? 'Datos inválidos',
        action: 'error',
      });
      return false;
    }

    savingRef.current = true;
    setSaving(true);

    const quantity = Number(parsed.data.cigarettes);

    try {
      const profile = getProfile();
      if (profile === null) {
        savingRef.current = false;
        setSaving(false);
        return false;
      }
      const logs = listInventoryLogs();
      const summary = computeInventorySummary(logs, profile.dailyCigarettes);
      if (quantity > summary.stock) {
        savingRef.current = false;
        setSaving(false);
        showAppToast({
          title: 'Stock insuficiente',
          description: `Solo quedan ${summary.stock} cigarrillos.`,
          action: 'warning',
        });
        return false;
      }
    } catch {
      savingRef.current = false;
      setSaving(false);
      showAppToast({
        title: 'No se pudo guardar',
        description: 'Inténtalo de nuevo.',
        action: 'error',
      });
      return false;
    }

    const payload = buildInventoryLog({
      syncId: createSyncId(),
      ownerUserId: getScopedOwnerUserId(),
      timestamp: Date.now(),
      actionType: 'consumption',
      quantity,
      cost: null,
    });

    try {
      const created = recordInventoryConsumption({
        timestampIso: payload.timestamp,
        quantity,
      });
      const ownerUserId = getScopedOwnerUserId();
      if (ownerUserId !== null) {
        enqueuePersonalSync(
          'inventory_log',
          created.inventoryLog.syncId,
          buildInventorySyncPayload(created.inventoryLog, ownerUserId),
        );
        const consentEmotions = getBackupPreferences().consentEmotions;
        for (const smokingEvent of created.smokingEvents) {
          enqueuePersonalSync(
            'smoking_event',
            smokingEvent.syncId,
            buildSmokingSyncPayload(smokingEvent, ownerUserId, consentEmotions),
          );
        }
      }
    } catch {
      savingRef.current = false;
      setSaving(false);
      showAppToast({
        title: 'No se pudo guardar',
        description: 'Inténtalo de nuevo.',
        action: 'error',
      });
      return false;
    }

    savingRef.current = false;
    setSaving(false);
    setForm(EMPTY_FORM);
    load();
    void resetIdleNotificationFromProfile();
    enqueueTeamSharedEvent('smoked');
    showAppToast({ title: 'Consumo registrado', action: 'success' });
    return true;
  }, [form, load]);

  return {
    ...state,
    form,
    saving,
    refresh: load,
    openPurchase,
    openConsumption,
    closeForm,
    updateForm,
    submitPurchase,
    submitConsumption,
  };
}
