import { count, desc, eq, max, sql } from 'drizzle-orm';

import { db } from './client';
import {
  inventoryLogs,
  pauseEvents,
  supplyInventory,
  smokeLogs,
  userProfile,
  type InventoryLog,
  type NewInventoryLog,
  type NewPauseEvent,
  type NewUserProfile,
  type PauseEvent,
  type SmokeLog,
  type SupplyInventoryItem,
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
