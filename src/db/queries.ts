import {
  and,
  asc,
  between,
  count,
  desc,
  eq,
  inArray,
  isNull,
  max,
  sql,
} from 'drizzle-orm';

import { db } from './client';
import {
  activeSmokingSession,
  globalSyncOutbox,
  inventoryLogs,
  pauseEvents,
  smokingEvents,
  supplyInventory,
  smokeLogs,
  syncState,
  teamEventOutbox,
  teamMembers,
  teams,
  userBadges,
  userProfile,
  type GlobalSyncOutbox,
  type InventoryLog,
  type NewInventoryLog,
  type NewSmokingEvent,
  type SmokingEvent,
  type ActiveSmokingSession,
  type NewActiveSmokingSession,
  type Team,
  type TeamEventOutbox,
  type TeamMember,
  type NewPauseEvent,
  type NewUserProfile,
  type PauseEvent,
  type SmokeLog,
  type SupplyInventoryItem,
  type UserBadge,
  type UserProfile,
} from './schema';
import type { PauseTotals, TriggerCount } from '@/shared/types/global';
import {
  GUEST_SCOPE,
  SYNC_STATE_KEYS,
  type PersonalSyncEntityType,
} from '@/shared/constants/sync';
import { isGuestScope } from '@/shared/utils/accountScope';
import { createSyncId } from '@/shared/utils/syncIds';

export function listSmokeLogs(): SmokeLog[] {
  return db.select().from(smokeLogs).orderBy(desc(smokeLogs.createdAt)).all();
}

export function listPostponedAttempts(): SmokeLog[] {
  return db
    .select()
    .from(smokeLogs)
    .where(eq(smokeLogs.postponed, 1))
    .orderBy(desc(smokeLogs.createdAt))
    .all();
}

export function listSupplyInventory(): SupplyInventoryItem[] {
  return db
    .select()
    .from(supplyInventory)
    .orderBy(desc(supplyInventory.purchasedAt))
    .all();
}

export function getProfile(): UserProfile | null {
  const scope = getActiveScope();
  const rows = db
    .select()
    .from(userProfile)
    .where(
      isGuestScope(scope)
        ? isNull(userProfile.ownerUserId)
        : eq(userProfile.ownerUserId, scope),
    )
    .limit(1)
    .all();
  return rows[0] ?? null;
}

export function getSyncState(key: string): string | null {
  const rows = db
    .select({ value: syncState.value })
    .from(syncState)
    .where(eq(syncState.key, key))
    .limit(1)
    .all();
  return rows[0]?.value ?? null;
}

export function setSyncState(key: string, value: string): void {
  const now = new Date().toISOString();
  db.insert(syncState)
    .values({ key, value, updatedAt: now })
    .onConflictDoUpdate({
      target: syncState.key,
      set: { value, updatedAt: now },
    })
    .run();
}

export function getActiveScope(): string {
  return getSyncState(SYNC_STATE_KEYS.activeScope) ?? GUEST_SCOPE;
}

export function setActiveScope(scope: string): void {
  setSyncState(SYNC_STATE_KEYS.activeScope, isGuestScope(scope) ? GUEST_SCOPE : scope);
}

export function getRestoreCheckpoint(key: string): string | null {
  return getSyncState(key);
}

export function setRestoreCheckpoint(key: string, value: string): void {
  setSyncState(key, value);
}

export function getScopedOwnerUserId(): string | null {
  const scope = getActiveScope();
  return isGuestScope(scope) ? null : scope;
}

export function saveProfile(input: NewUserProfile): UserProfile {
  return db.insert(userProfile).values(input).returning().get();
}

export function updateProfileSettings(
  id: number,
  input: Partial<Pick<NewUserProfile, 'dailyCigarettes' | 'packCost' | 'currency' | 'quitGoal'>>,
): UserProfile {
  return db
    .update(userProfile)
    .set({ ...input, updatedAt: new Date().toISOString() })
    .where(eq(userProfile.id, id))
    .returning()
    .get();
}

export function incrementPostponedCount(): UserProfile {
  const scope = getActiveScope();
  return db
    .update(userProfile)
    .set({ postponedCount: sql`${userProfile.postponedCount} + 1` })
    .where(
      isGuestScope(scope)
        ? isNull(userProfile.ownerUserId)
        : eq(userProfile.ownerUserId, scope),
    )
    .returning()
    .get();
}

export function listPauseEvents(): PauseEvent[] {
  const scope = getActiveScope();
  return db
    .select()
    .from(pauseEvents)
    .where(
      isGuestScope(scope)
        ? isNull(pauseEvents.ownerUserId)
        : eq(pauseEvents.ownerUserId, scope),
    )
    .orderBy(desc(pauseEvents.timestamp), desc(pauseEvents.id))
    .all();
}

export function getPauseTotals(): PauseTotals {
  const scope = getActiveScope();
  const rows = db
    .select({
      total: count(),
      resisted: sql<number>`coalesce(sum(case when ${pauseEvents.resisted} = 1 then 1 else 0 end), 0)`,
      ceded: sql<number>`coalesce(sum(case when ${pauseEvents.resisted} = 0 then 1 else 0 end), 0)`,
    })
    .from(pauseEvents)
    .where(
      isGuestScope(scope)
        ? isNull(pauseEvents.ownerUserId)
        : eq(pauseEvents.ownerUserId, scope),
    )
    .all();
  const row = rows[0];

  return {
    total: Number(row?.total ?? 0),
    resisted: Number(row?.resisted ?? 0),
    ceded: Number(row?.ceded ?? 0),
  };
}

export function listTriggerCounts(): TriggerCount[] {
  const scope = getActiveScope();
  return db
    .select({
      triggerEmotion: pauseEvents.triggerEmotion,
      count: count(),
    })
    .from(pauseEvents)
    .where(
      isGuestScope(scope)
        ? isNull(pauseEvents.ownerUserId)
        : eq(pauseEvents.ownerUserId, scope),
    )
    .groupBy(pauseEvents.triggerEmotion)
    .all()
    .map((row) => ({
      triggerEmotion: row.triggerEmotion,
      count: Number(row.count),
    }));
}

export function getLatestCededTimestamp(): string | null {
  const scope = getActiveScope();
  const rows = db
    .select({ timestamp: max(pauseEvents.timestamp) })
    .from(pauseEvents)
    .where(
      and(
        eq(pauseEvents.resisted, 0),
        isGuestScope(scope)
          ? isNull(pauseEvents.ownerUserId)
          : eq(pauseEvents.ownerUserId, scope),
      ),
    )
    .all();

  return rows[0]?.timestamp ?? null;
}

export function getLatestPauseEventTimestamp(): string | null {
  const scope = getActiveScope();
  const rows = db
    .select({ timestamp: max(pauseEvents.timestamp) })
    .from(pauseEvents)
    .where(
      isGuestScope(scope)
        ? isNull(pauseEvents.ownerUserId)
        : eq(pauseEvents.ownerUserId, scope),
    )
    .all();

  return rows[0]?.timestamp ?? null;
}

/**
 * Most recent real habit interaction (completed or ongoing smoking event, or a
 * postponed pause). Used to anchor the idle reminder so merely opening the app
 * does not reset the timer.
 */
export function getLatestHabitInteractionAtMs(): number | null {
  const candidates = [
    getLatestSmokingEventTimestamp(),
    getLatestPauseEventTimestamp(),
  ];

  let latestMs = 0;
  for (const candidate of candidates) {
    if (candidate === null) {
      continue;
    }
    const parsedMs = Date.parse(candidate);
    if (Number.isFinite(parsedMs) && parsedMs > latestMs) {
      latestMs = parsedMs;
    }
  }

  return latestMs > 0 ? latestMs : null;
}

export function createPauseEvent(input: NewPauseEvent): PauseEvent {
  return db.insert(pauseEvents).values(input).returning().get();
}

export function recordPostponedPause(timestampIso: string): PauseEvent {
  const scope = getActiveScope();
  const ownerUserId = isGuestScope(scope) ? null : scope;
  return db.transaction((transaction) => {
    transaction
      .update(userProfile)
      .set({ postponedCount: sql`${userProfile.postponedCount} + 1` })
      .where(
        isGuestScope(scope)
          ? isNull(userProfile.ownerUserId)
          : eq(userProfile.ownerUserId, scope),
      )
      .run();
    return transaction
      .insert(pauseEvents)
      .values({
        syncId: createSyncId(),
        ownerUserId,
        timestamp: timestampIso,
        triggerEmotion: 'habit',
        resisted: 1,
        notes: null,
      })
      .returning()
      .get();
  });
}

export function countPauseEventsBetween(
  startIso: string,
  endIso: string,
  resisted?: boolean,
): number {
  const scope = getActiveScope();
  const filters = [
    between(pauseEvents.timestamp, startIso, endIso),
    isGuestScope(scope)
      ? isNull(pauseEvents.ownerUserId)
      : eq(pauseEvents.ownerUserId, scope),
  ];
  if (resisted !== undefined) {
    filters.push(eq(pauseEvents.resisted, resisted ? 1 : 0));
  }
  const rows = db
    .select({ count: count() })
    .from(pauseEvents)
    .where(and(...filters))
    .all();
  return Number(rows[0]?.count ?? 0);
}

export function listInventoryLogs(): InventoryLog[] {
  const scope = getActiveScope();
  return db
    .select()
    .from(inventoryLogs)
    .where(
      isGuestScope(scope)
        ? isNull(inventoryLogs.ownerUserId)
        : eq(inventoryLogs.ownerUserId, scope),
    )
    .orderBy(desc(inventoryLogs.timestamp))
    .all();
}

export function createInventoryLog(input: NewInventoryLog): InventoryLog {
  return db.insert(inventoryLogs).values(input).returning().get();
}

export function recordInventoryConsumption(input: {
  timestampIso: string;
  quantity: number;
}): { inventoryLog: InventoryLog; smokingEvents: SmokingEvent[] } {
  const quantity = Math.floor(input.quantity);
  if (!Number.isFinite(quantity) || quantity < 1) {
    throw new Error('La cantidad de consumo debe ser mayor que cero.');
  }

  const scope = getActiveScope();
  const ownerUserId = isGuestScope(scope) ? null : scope;
  const createdLogs: InventoryLog[] = [];
  const createdEvents: SmokingEvent[] = [];

  db.transaction((transaction) => {
    createdLogs.push(
      transaction
        .insert(inventoryLogs)
        .values({
          syncId: createSyncId(),
          ownerUserId,
          timestamp: input.timestampIso,
          actionType: 'consumption',
          quantity,
          cost: null,
        })
        .returning()
        .get(),
    );

    for (let index = 0; index < quantity; index += 1) {
      createdEvents.push(
        transaction
          .insert(smokingEvents)
          .values({
            syncId: createSyncId(),
            ownerUserId,
            timestamp: input.timestampIso,
            triggerEmotion: 'habit',
            durationSeconds: 0,
            inventoryDecremented: 1,
          })
          .returning()
          .get(),
      );
    }
  });

  const inventoryLog = createdLogs[0];
  if (inventoryLog === undefined) {
    throw new Error('No se pudo registrar el consumo.');
  }

  return { inventoryLog, smokingEvents: createdEvents };
}

export function createSmokingEvent(input: NewSmokingEvent): SmokingEvent {
  return db.insert(smokingEvents).values(input).returning().get();
}

export function listSmokingEvents(): SmokingEvent[] {
  const scope = getActiveScope();
  return db
    .select()
    .from(smokingEvents)
    .where(
      isGuestScope(scope)
        ? isNull(smokingEvents.ownerUserId)
        : eq(smokingEvents.ownerUserId, scope),
    )
    .orderBy(desc(smokingEvents.timestamp), desc(smokingEvents.id))
    .all();
}

export function countSmokingEventsBetween(startIso: string, endIso: string): number {
  const scope = getActiveScope();
  const rows = db
    .select({ count: count() })
    .from(smokingEvents)
    .where(
      and(
        between(smokingEvents.timestamp, startIso, endIso),
        isGuestScope(scope)
          ? isNull(smokingEvents.ownerUserId)
          : eq(smokingEvents.ownerUserId, scope),
      ),
    )
    .all();
  return Number(rows[0]?.count ?? 0);
}

export function getLatestSmokingEventTimestamp(): string | null {
  const scope = getActiveScope();
  const rows = db
    .select({ timestamp: max(smokingEvents.timestamp) })
    .from(smokingEvents)
    .where(
      isGuestScope(scope)
        ? isNull(smokingEvents.ownerUserId)
        : eq(smokingEvents.ownerUserId, scope),
    )
    .all();
  return rows[0]?.timestamp ?? null;
}

export function getActiveSmokingSession(): ActiveSmokingSession | null {
  const rows = db
    .select()
    .from(activeSmokingSession)
    .limit(1)
    .all();
  return rows[0] ?? null;
}

export function startActiveSmokingSession(
  input: NewActiveSmokingSession,
): ActiveSmokingSession {
  db.transaction((transaction) => {
    transaction.delete(activeSmokingSession).run();
    transaction.insert(activeSmokingSession).values(input).run();
  });

  const created = getActiveSmokingSession();
  if (created === null) {
    throw new Error('No se pudo iniciar la sesión de fumado.');
  }
  return created;
}

export function clearActiveSmokingSession(sessionId?: string): void {
  if (sessionId === undefined) {
    db.delete(activeSmokingSession).run();
    return;
  }
  db.delete(activeSmokingSession)
    .where(eq(activeSmokingSession.id, sessionId))
    .run();
}

export function getTeamByInviteCode(inviteCode: string): Team | null {
  const rows = db
    .select()
    .from(teams)
    .where(eq(teams.inviteCode, inviteCode))
    .limit(1)
    .all();
  return rows[0] ?? null;
}

export function getTeamById(teamId: string): Team | null {
  const rows = db.select().from(teams).where(eq(teams.id, teamId)).limit(1).all();
  return rows[0] ?? null;
}

export function getActiveTeam(): Team | null {
  const rows = db
    .select({ teamId: teamMembers.teamId })
    .from(teamMembers)
    .orderBy(desc(teamMembers.joinedAt))
    .limit(1)
    .all();
  const teamId = rows[0]?.teamId;
  return teamId !== undefined ? getTeamById(teamId) : null;
}

export function listTeamMembers(teamId: string): TeamMember[] {
  return db
    .select()
    .from(teamMembers)
    .where(eq(teamMembers.teamId, teamId))
    .orderBy(desc(teamMembers.joinedAt))
    .all();
}

export function enqueueTeamEvent(input: {
  id: string;
  teamId: string;
  userName: string;
  eventType: string;
  timestamp: string;
  createdAt: string;
}): void {
  db.insert(teamEventOutbox)
    .values({
      ...input,
      status: 'pending',
      attempts: 0,
      lastError: null,
    })
    .run();
}

export function listPendingTeamEvents(limit = 20): TeamEventOutbox[] {
  return db
    .select()
    .from(teamEventOutbox)
    .where(inArray(teamEventOutbox.status, ['pending', 'failed']))
    .orderBy(asc(teamEventOutbox.createdAt))
    .limit(limit)
    .all();
}

export function markTeamEventSent(id: string): void {
  db.update(teamEventOutbox)
    .set({ status: 'sent', lastError: null })
    .where(eq(teamEventOutbox.id, id))
    .run();
}

export function markTeamEventFailed(id: string, error: string): void {
  db.update(teamEventOutbox)
    .set({
      status: 'failed',
      attempts: sql`${teamEventOutbox.attempts} + 1`,
      lastError: error,
    })
    .where(eq(teamEventOutbox.id, id))
    .run();
}

export function countPendingTeamEvents(): number {
  const rows = db
    .select({ count: count() })
    .from(teamEventOutbox)
    .where(inArray(teamEventOutbox.status, ['pending', 'failed']))
    .all();
  return Number(rows[0]?.count ?? 0);
}

export function findTeamMember(teamId: string, userName: string): TeamMember | null {
  const rows = db
    .select()
    .from(teamMembers)
    .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userName, userName)))
    .limit(1)
    .all();
  return rows[0] ?? null;
}

export function updateTeamMemberProgress(
  memberId: string,
  progress: {
    postponedCount: number;
    smokedToday: number;
    streakDays: number;
    hadStumble: boolean;
  },
): void {
  db.update(teamMembers)
    .set({
      postponedCount: progress.postponedCount,
      smokedToday: progress.smokedToday,
      streakDays: progress.streakDays,
      hadStumble: progress.hadStumble ? 1 : 0,
    })
    .where(eq(teamMembers.id, memberId))
    .run();
}

export function listUserBadges(): UserBadge[] {
  const scope = getActiveScope();
  return db
    .select()
    .from(userBadges)
    .where(
      isGuestScope(scope)
        ? isNull(userBadges.ownerUserId)
        : eq(userBadges.ownerUserId, scope),
    )
    .orderBy(desc(userBadges.unlockedAt))
    .all();
}

export function unlockBadges(
  entries: { badgeKey: string; unlockedAt: string }[],
): UserBadge[] {
  if (entries.length === 0) {
    return [];
  }
  const scope = getActiveScope();
  const ownerUserId = isGuestScope(scope) ? null : scope;
  return db
    .insert(userBadges)
    .values(
      entries.map((entry) => ({
        ...entry,
        syncId: createSyncId(),
        ownerUserId,
      })),
    )
    .onConflictDoNothing()
    .returning()
    .all();
}

export function enqueuePersonalSyncItem(input: {
  entityType: PersonalSyncEntityType;
  entityId: string;
  payload: string;
}): void {
  const now = new Date().toISOString();
  db.insert(globalSyncOutbox)
    .values({
      id: createSyncId(),
      entityType: input.entityType,
      entityId: input.entityId,
      payload: input.payload,
      status: 'pending',
      attempts: 0,
      lastError: null,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [globalSyncOutbox.entityType, globalSyncOutbox.entityId],
      set: {
        payload: input.payload,
        status: 'pending',
        attempts: 0,
        lastError: null,
        updatedAt: now,
      },
    })
    .run();
}

export function listPendingPersonalSyncItems(limit: number): GlobalSyncOutbox[] {
  return db
    .select()
    .from(globalSyncOutbox)
    .where(inArray(globalSyncOutbox.status, ['pending', 'failed']))
    .orderBy(asc(globalSyncOutbox.createdAt))
    .limit(limit)
    .all();
}

export function markPersonalSyncSent(id: string): void {
  db.update(globalSyncOutbox)
    .set({
      status: 'sent',
      lastError: null,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(globalSyncOutbox.id, id))
    .run();
}

export function markPersonalSyncFailed(id: string, error: string): void {
  db.update(globalSyncOutbox)
    .set({
      status: 'failed',
      attempts: sql`${globalSyncOutbox.attempts} + 1`,
      lastError: error,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(globalSyncOutbox.id, id))
    .run();
}

export function countPendingPersonalSyncItems(): number {
  const rows = db
    .select({ count: count() })
    .from(globalSyncOutbox)
    .where(inArray(globalSyncOutbox.status, ['pending', 'failed']))
    .all();
  return Number(rows[0]?.count ?? 0);
}

export function pruneSentPersonalSyncItems(olderThanIso: string): void {
  db.delete(globalSyncOutbox)
    .where(
      and(
        eq(globalSyncOutbox.status, 'sent'),
        sql`${globalSyncOutbox.updatedAt} < ${olderThanIso}`,
      ),
    )
    .run();
}
