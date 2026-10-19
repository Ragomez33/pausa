import { desc, eq } from 'drizzle-orm';

import { db } from './client';
import {
  pauseEvents,
  supplyInventory,
  smokeLogs,
  userProfile,
  type NewPauseEvent,
  type NewUserProfile,
  type PauseEvent,
  type SmokeLog,
  type SupplyInventoryItem,
  type UserProfile,
} from './schema';

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
    .orderBy(desc(pauseEvents.createdAt))
    .all();
}

export function createPauseEvent(input: NewPauseEvent): PauseEvent {
  return db.insert(pauseEvents).values(input).returning().get();
}
