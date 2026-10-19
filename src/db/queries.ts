import { between, count, desc, eq, max, sql } from 'drizzle-orm';

import { db } from './client';
import {
  inventoryLogs,
  pauseEvents,
  smokingEvents,
  supplyInventory,
  smokeLogs,
  teamMembers,
  teams,
  userBadges,
  userProfile,
  type InventoryLog,
  type NewInventoryLog,
  type NewSmokingEvent,
  type NewTeam,
  type NewTeamMember,
  type SmokingEvent,
  type Team,
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

export function createTeam(input: NewTeam): Team {
  return db.insert(teams).values(input).returning().get();
}

export function listTeams(): Team[] {
  return db.select().from(teams).orderBy(desc(teams.createdAt)).all();
}

export function createTeamMember(input: NewTeamMember): TeamMember {
  return db.insert(teamMembers).values(input).returning().get();
}

export function listTeamMembers(teamId: number): TeamMember[] {
  return db
    .select()
    .from(teamMembers)
    .where(eq(teamMembers.teamId, teamId))
    .orderBy(desc(teamMembers.id))
    .all();
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
