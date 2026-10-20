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
}

const listeners = new Set<() => void>();
let syncing = false;
let lastError: PersonalSyncErrorKind = null;
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
    const items = listPendingPersonalSyncItems(PERSONAL_SYNC_BATCH_SIZE);
    const auth = getAuthSnapshot();
    const activeUserId = auth.userId;
    let failure: PersonalSyncErrorKind = null;

    for (const item of items) {
      const payload = parsePayload(item.payload);
      if (payload === null) {
        markPersonalSyncFailed(item.id, 'Invalid personal sync payload');
        failure = 'fatal';
        break;
      }

      const payloadOwner =
        typeof payload.user_id === 'string'
          ? payload.user_id
          : typeof payload.id === 'string'
            ? payload.id
            : null;
      if (activeUserId === null || payloadOwner !== activeUserId) {
        continue;
      }

      const table = TABLE_BY_ENTITY[item.entityType as PersonalSyncEntityType];
      if (table === undefined) {
        markPersonalSyncFailed(item.id, 'Unknown personal sync entity');
        failure = 'fatal';
        break;
      }

      const { error } = await client.from(table).upsert(payload, { onConflict: 'id' });
      if (error !== null) {
        if (error.code === '23505') {
          markPersonalSyncSent(item.id);
          continue;
        }
        failure = classifyError(error.message);
        markPersonalSyncFailed(item.id, error.message);
        break;
      }
      markPersonalSyncSent(item.id);
    }

    lastError = failure;
    if (failure === null) {
      setSyncState(SYNC_STATE_KEYS.lastSyncAt, new Date().toISOString());
      const cutoff = new Date(
        Date.now() - PERSONAL_SYNC_SENT_RETENTION_DAYS * 86_400_000,
      ).toISOString();
      pruneSentPersonalSyncItems(cutoff);
    }
  } catch (caught) {
    lastError = classifyError(
      caught instanceof Error ? caught.message : 'network',
    );
  } finally {
    syncing = false;
    notify();
  }
}

export function flushPersonalOutbox(): Promise<PersonalSyncSnapshot> {
  if (!isSupabaseConfigured()) {
    return Promise.resolve(getPersonalSyncSnapshot());
  }

  const run = queue.then(runFlush, runFlush);
  queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run.then(getPersonalSyncSnapshot);
}

export const PERSONAL_SYNC_TIMER_MS = PERSONAL_SYNC_RETRY_MS;
