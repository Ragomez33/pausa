import { and, asc, between, count, desc, eq, inArray, max, sql } from 'drizzle-orm';

import { db } from './client';
import {
  activeSmokingSession,
  inventoryLogs,
  pauseEvents,
  smokingEvents,
  supplyInventory,
  smokeLogs,
  teamEventOutbox,
  teamMembers,
  teams,
  userBadges,
  userProfile,
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
  const rows = db.select().from(userProfile).limit(1).all();
  return rows[0] ?? null;
}

export function saveProfile(input: NewUserProfile): UserProfile {
  return db.insert(userProfile).values(input).returning().get();
}

export function incrementPostponedCount(): UserProfile {
  return db
    .update(userProfile)
    .set({ postponedCount: sql`${userProfile.postponedCount} + 1` })
    .returning()
    .get();
}

export function listPauseEvents(): PauseEvent[] {
  return db
    .select()
    .from(pauseEvents)
    .orderBy(desc(pauseEvents.timestamp), desc(pauseEvents.id))
    .all();
}

export function getPauseTotals(): PauseTotals {
  const rows = db
    .select({
      total: count(),
      resisted: sql<number>`coalesce(sum(case when ${pauseEvents.resisted} = 1 then 1 else 0 end), 0)`,
      ceded: sql<number>`coalesce(sum(case when ${pauseEvents.resisted} = 0 then 1 else 0 end), 0)`,
    })
    .from(pauseEvents)
    .all();
  const row = rows[0];

  return {
    total: Number(row?.total ?? 0),
    resisted: Number(row?.resisted ?? 0),
    ceded: Number(row?.ceded ?? 0),
  };
}

export function listTriggerCounts(): TriggerCount[] {
  return db
    .select({
      triggerEmotion: pauseEvents.triggerEmotion,
      count: count(),
    })
    .from(pauseEvents)
    .groupBy(pauseEvents.triggerEmotion)
    .all()
    .map((row) => ({
      triggerEmotion: row.triggerEmotion,
      count: Number(row.count),
    }));
}

export function getLatestCededTimestamp(): string | null {
  const rows = db
    .select({ timestamp: max(pauseEvents.timestamp) })
    .from(pauseEvents)
    .where(eq(pauseEvents.resisted, 0))
    .all();

  return rows[0]?.timestamp ?? null;
}

export function createPauseEvent(input: NewPauseEvent): PauseEvent {
  return db.insert(pauseEvents).values(input).returning().get();
}

export function listInventoryLogs(): InventoryLog[] {
  return db
    .select()
    .from(inventoryLogs)
    .orderBy(desc(inventoryLogs.timestamp))
    .all();
}

export function createInventoryLog(input: NewInventoryLog): InventoryLog {
  return db.insert(inventoryLogs).values(input).returning().get();
}

export function createSmokingEvent(input: NewSmokingEvent): SmokingEvent {
  return db.insert(smokingEvents).values(input).returning().get();
}

export function listSmokingEvents(): SmokingEvent[] {
  return db
    .select()
    .from(smokingEvents)
    .orderBy(desc(smokingEvents.timestamp), desc(smokingEvents.id))
    .all();
}

export function countSmokingEventsBetween(startIso: string, endIso: string): number {
  const rows = db
    .select({ count: count() })
    .from(smokingEvents)
    .where(between(smokingEvents.timestamp, startIso, endIso))
    .all();
  return Number(rows[0]?.count ?? 0);
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
  return db
    .select()
    .from(userBadges)
    .orderBy(desc(userBadges.unlockedAt))
    .all();
}

export function unlockBadges(
  entries: { badgeKey: string; unlockedAt: string }[],
): void {
  if (entries.length === 0) {
    return;
  }
  db.insert(userBadges)
    .values(entries)
    .onConflictDoNothing({ target: userBadges.badgeKey })
    .run();
}
