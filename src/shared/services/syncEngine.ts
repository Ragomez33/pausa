import {
  countPendingPersonalSyncItems,
  enqueuePersonalSyncItem,
  getScopedOwnerUserId,
  listPendingPersonalSyncItems,
  markPersonalSyncFailed,
  markPersonalSyncSent,
  pruneSentPersonalSyncItems,
  setSyncState,
} from '@/db/queries';
import { isSupabaseConfigured, getSupabaseClient } from '@/services/supabase';
import {
  PERSONAL_SYNC_BATCH_SIZE,
  PERSONAL_SYNC_MAX_RETRY_MS,
  PERSONAL_SYNC_RETRY_MS,
  PERSONAL_SYNC_SENT_RETENTION_DAYS,
  SYNC_STATE_KEYS,
  type PersonalSyncEntityType,
  type PersonalSyncErrorKind,
  type PersonalSyncStatus,
} from '@/shared/constants/sync';
import type { PersonalSyncStatusInput } from '@/shared/utils/personalSyncStatus';
import { derivePersonalSyncStatus } from '@/shared/utils/personalSyncStatus';
import type { PersonalSyncPayload } from '@/shared/utils/personalSyncPayloads';

import { getAuthSnapshot } from './authService';
import { isPersonalBackupActive } from './syncPreferences';

export interface PersonalSyncSnapshot {
  status: PersonalSyncStatus;
  pendingCount: number;
  configured: boolean;
  authenticated: boolean;
  backupEnabled: boolean;
  lastError: PersonalSyncErrorKind;
  lastErrorCode: string | null;
  lastErrorMessage: string | null;
  nextRetryAt: string | null;
}

const listeners = new Set<() => void>();
let syncing = false;
let lastError: PersonalSyncErrorKind = null;
let lastErrorCode: string | null = null;
let lastErrorMessage: string | null = null;
let consecutiveFailures = 0;
let nextRetryAtMs = 0;
let queue: Promise<void> = Promise.resolve();

const TABLE_BY_ENTITY: Record<PersonalSyncEntityType, string> = {
  profile: 'user_profiles',
  smoking_event: 'smoking_events',
  inventory_log: 'inventory_logs',
  achievement: 'user_achievements',
};

function notify(): void {
  for (const listener of listeners) {
    listener();
  }
}

function classifyError(message: string): PersonalSyncErrorKind {
  const normalized = message.toLowerCase();
  const fatalMarkers = [
    'jwt',
    'permission',
    'row-level',
    'row level',
    'relation',
    'schema',
    'does not exist',
    'invalid api key',
    'unauthorized',
    'policy',
  ];
  return fatalMarkers.some((marker) => normalized.includes(marker))
    ? 'fatal'
    : 'network';
}

function readPendingCount(): number {
  try {
    return countPendingPersonalSyncItems();
  } catch {
    return 0;
  }
}

function scheduleRetry(): void {
  consecutiveFailures += 1;
  const delay = Math.min(
    PERSONAL_SYNC_RETRY_MS * 2 ** Math.max(0, consecutiveFailures - 1),
    PERSONAL_SYNC_MAX_RETRY_MS,
  );
  nextRetryAtMs = Date.now() + delay;
}

function resetRetry(): void {
  consecutiveFailures = 0;
  nextRetryAtMs = 0;
}

function normalizePayloadForUser(
  entityType: PersonalSyncEntityType,
  payload: Record<string, unknown>,
  userId: string,
): Record<string, unknown> | null {
  const normalized = { ...payload };

  if (entityType === 'profile') {
    delete normalized.user_id;
    normalized.id = userId;
    return normalized;
  }

  if (
    typeof normalized.user_id === 'string' &&
    normalized.user_id.length > 0 &&
    normalized.user_id !== userId
  ) {
    return null;
  }

  normalized.user_id = userId;
  return normalized;
}

function buildStatusInput(): PersonalSyncStatusInput {
  const configured = isSupabaseConfigured();
  const auth = getAuthSnapshot();
  return {
    configured,
    authenticated: auth.status === 'authenticated',
    backupEnabled: isPersonalBackupActive(),
    pendingCount: configured ? readPendingCount() : 0,
    syncing,
    lastError,
  };
}

export function getPersonalSyncSnapshot(): PersonalSyncSnapshot {
  const input = buildStatusInput();
  return {
    status: derivePersonalSyncStatus(input),
    pendingCount: input.pendingCount,
    configured: input.configured,
    authenticated: input.authenticated,
    backupEnabled: input.backupEnabled,
    lastError: input.lastError,
    lastErrorCode,
    lastErrorMessage,
    nextRetryAt:
      nextRetryAtMs > Date.now() ? new Date(nextRetryAtMs).toISOString() : null,
  };
}

export function subscribeToPersonalSync(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function enqueuePersonalSync(
  entityType: PersonalSyncEntityType,
  entityId: string,
  payload: PersonalSyncPayload,
): void {
  const ownerUserId = getScopedOwnerUserId();
  if (ownerUserId === null || !isPersonalBackupActive()) {
    return;
  }

  try {
    enqueuePersonalSyncItem({
      entityType,
      entityId,
      payload: JSON.stringify(payload),
    });
    notify();
    void flushPersonalOutbox();
  } catch {
    // Local actions must never fail because personal backup could not be queued.
  }
}

function parsePayload(payload: string): Record<string, unknown> | null {
  try {
    const parsed: unknown = JSON.parse(payload);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return null;
    }
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function runFlush(): Promise<void> {
  const client = getSupabaseClient();
  if (client === null || !isPersonalBackupActive()) {
    return;
  }

  syncing = true;
  notify();

  try {
    const { data: authData, error: authError } = await client.auth.getUser();
    const authenticatedUserId =
      authData.user?.id ?? getAuthSnapshot().userId ?? null;

    if (authenticatedUserId === null) {
      lastError = 'fatal';
      lastErrorCode = 'AUTH';
      lastErrorMessage = authError?.message ?? 'No hay un usuario autenticado.';
      console.warn('[PersonalSync] usuario no autenticado', {
        code: lastErrorCode,
        message: lastErrorMessage,
      });
      scheduleRetry();
      return;
    }

    if (authError !== null) {
      console.warn('[PersonalSync] getUser falló; se usa la sesión local', {
        message: authError.message,
        userId: authenticatedUserId,
      });
    }

    const activeUserId = authenticatedUserId;
    const items = listPendingPersonalSyncItems(PERSONAL_SYNC_BATCH_SIZE);
    let failure: PersonalSyncErrorKind = null;

    console.info('[PersonalSync] iniciando lote', {
      pending: items.length,
      userId: activeUserId,
    });

    for (const item of items) {
      const parsed = parsePayload(item.payload);
      if (parsed === null) {
        markPersonalSyncFailed(item.id, 'Invalid personal sync payload');
        failure = 'fatal';
        lastErrorMessage = 'El payload de sincronización no es válido.';
        lastErrorCode = 'PAYLOAD';
        break;
      }

      const table = TABLE_BY_ENTITY[item.entityType as PersonalSyncEntityType];
      if (table === undefined) {
        markPersonalSyncFailed(item.id, 'Unknown personal sync entity');
        failure = 'fatal';
        lastErrorMessage = 'El tipo de entidad de sincronización no existe.';
        lastErrorCode = 'ENTITY';
        break;
      }

      const payload = normalizePayloadForUser(
        item.entityType as PersonalSyncEntityType,
        parsed,
        activeUserId,
      );
      if (payload === null) {
        console.warn('[PersonalSync] se omite un registro de otra cuenta', {
          entityType: item.entityType,
          entityId: item.entityId,
        });
        continue;
      }

      const { error } = await client.from(table).upsert(payload, { onConflict: 'id' });
      if (error !== null) {
        if (error.code === '23505') {
          markPersonalSyncSent(item.id);
          continue;
        }

        failure = classifyError(error.message);
        lastErrorCode = error.code ?? null;
        lastErrorMessage = error.message;
        markPersonalSyncFailed(
          item.id,
          `${error.code ?? 'ERROR'}: ${error.message}`,
        );
        console.warn('[PersonalSync] upsert falló', {
          entityType: item.entityType,
          entityId: item.entityId,
          table,
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
        break;
      }

      markPersonalSyncSent(item.id);
    }

    lastError = failure;
    if (failure === null) {
      resetRetry();
      setSyncState(SYNC_STATE_KEYS.lastSyncAt, new Date().toISOString());
      const cutoff = new Date(
        Date.now() - PERSONAL_SYNC_SENT_RETENTION_DAYS * 86_400_000,
      ).toISOString();
      pruneSentPersonalSyncItems(cutoff);
      console.info('[PersonalSync] lote completado', { processed: items.length });
    } else {
      scheduleRetry();
      console.warn('[PersonalSync] lote con errores; reintento programado', {
        failure,
        nextRetryAt: new Date(nextRetryAtMs).toISOString(),
      });
    }
  } catch (caught) {
    lastError = classifyError(
      caught instanceof Error ? caught.message : 'network',
    );
    lastErrorCode = 'EXCEPTION';
    lastErrorMessage =
      caught instanceof Error ? caught.message : 'Error de red desconocido.';
    scheduleRetry();
    console.warn('[PersonalSync] excepción durante el lote', {
      message: lastErrorMessage,
      nextRetryAt: new Date(nextRetryAtMs).toISOString(),
    });
  } finally {
    syncing = false;
    notify();
  }
}

export function flushPersonalOutbox(force = false): Promise<PersonalSyncSnapshot> {
  if (!isSupabaseConfigured()) {
    return Promise.resolve(getPersonalSyncSnapshot());
  }
  if (!force && Date.now() < nextRetryAtMs) {
    return Promise.resolve(getPersonalSyncSnapshot());
  }

  const run = queue.then(runFlush, runFlush);
  queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run.then(getPersonalSyncSnapshot);
}

export function retryPersonalSyncNow(): Promise<PersonalSyncSnapshot> {
  resetRetry();
  return flushPersonalOutbox(true);
}

export const PERSONAL_SYNC_TIMER_MS = PERSONAL_SYNC_RETRY_MS;
