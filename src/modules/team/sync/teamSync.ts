import {
  countPendingTeamEvents,
  enqueueTeamEvent,
  getActiveTeam,
  listPendingTeamEvents,
  markTeamEventFailed,
  markTeamEventSent,
} from '@/db/queries';
import { getSupabaseClient, isSupabaseConfigured } from '@/services/supabase';

import { DEFAULT_TEAM_USER_NAME } from '../utils/constants';
import { buildTeamSharedEvent } from './teamEvents';
import type { TeamSyncErrorKind, TeamSyncStatus } from './syncStatus';
import { deriveTeamSyncStatus } from './syncStatus';

export interface TeamSyncSnapshot {
  status: TeamSyncStatus;
  pendingCount: number;
  configured: boolean;
  lastError: TeamSyncErrorKind;
}

const listeners = new Set<() => void>();
let syncing = false;
let lastError: TeamSyncErrorKind = null;
let queue: Promise<void> = Promise.resolve();

function notify(): void {
  for (const listener of listeners) {
    listener();
  }
}

function readPendingCount(): number {
  try {
    return countPendingTeamEvents();
  } catch {
    return 0;
  }
}

function classifyError(message: string): TeamSyncErrorKind {
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
  ];
  return fatalMarkers.some((marker) => normalized.includes(marker)) ? 'fatal' : 'network';
}

export function getTeamSyncStatusSnapshot(): TeamSyncSnapshot {
  const configured = isSupabaseConfigured();
  const pendingCount = configured ? readPendingCount() : 0;
  return {
    status: deriveTeamSyncStatus({ configured, pendingCount, syncing, lastError }),
    pendingCount,
    configured,
    lastError,
  };
}

export function subscribeToTeamSync(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function enqueueTeamSharedEvent(eventType: 'posponed' | 'smoked'): void {
  if (!isSupabaseConfigured()) {
    return;
  }

  try {
    const team = getActiveTeam();
    if (team === null) {
      return;
    }
    const payload = buildTeamSharedEvent(
      eventType,
      team.id,
      DEFAULT_TEAM_USER_NAME,
      Date.now(),
    );
    enqueueTeamEvent(payload);
    notify();
    void flushTeamOutbox();
  } catch {
    // Local actions must never fail because team sharing could not be queued.
  }
}

async function runFlush(): Promise<void> {
  const client = getSupabaseClient();
  if (client === null) {
    return;
  }

  syncing = true;
  notify();

  try {
    const events = listPendingTeamEvents(25);
    let failure: TeamSyncErrorKind = null;

    for (const event of events) {
      const { error } = await client.from('shared_events').insert({
        id: event.id,
        team_id: event.teamId,
        user_name: event.userName,
        event_type: event.eventType,
        timestamp: event.timestamp,
      });

      if (error !== null) {
        // A duplicate event id means a previous attempt reached the server but
        // its acknowledgement was lost; treat it as delivered.
        if (error.code === '23505') {
          markTeamEventSent(event.id);
          continue;
        }
        failure = classifyError(error.message);
        markTeamEventFailed(event.id, error.message);
        break;
      }

      markTeamEventSent(event.id);
    }

    lastError = failure;
  } catch (caught) {
    lastError = classifyError(caught instanceof Error ? caught.message : 'network');
  } finally {
    syncing = false;
    notify();
  }
}

export function flushTeamOutbox(): Promise<TeamSyncSnapshot> {
  if (!isSupabaseConfigured()) {
    return Promise.resolve(getTeamSyncStatusSnapshot());
  }

  const run = queue.then(runFlush, runFlush);
  queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run.then(getTeamSyncStatusSnapshot);
}
