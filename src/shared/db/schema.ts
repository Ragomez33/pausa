import { index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { DEFAULT_CURRENCY } from '../constants/app';

export const userProfile = sqliteTable('user_profile', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  displayName: text('display_name'),
  dailyTarget: integer('daily_target').notNull().default(0),
  smokeIntervalMinutes: integer('smoke_interval_minutes').notNull().default(0),
  packSize: integer('pack_size').notNull().default(20),
  dailyCigarettes: integer('daily_cigarettes').notNull().default(0),
  packCost: real('pack_cost').notNull().default(0),
  currency: text('currency').notNull().default(DEFAULT_CURRENCY),
  quitGoal: text('quit_goal'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export const smokeLogs = sqliteTable(
  'smoke_logs',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    createdAt: integer('created_at').notNull(),
    reason: text('reason'),
    postponed: integer('postponed').notNull().default(0),
    notes: text('notes'),
  },
  (table) => [index('idx_smoke_logs_created_at').on(table.createdAt)],
);

export const supplyInventory = sqliteTable(
  'supply_inventory',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    purchasedAt: integer('purchased_at').notNull(),
    packCount: integer('pack_count').notNull().default(1),
    cigarettesPerPack: integer('cigarettes_per_pack').notNull().default(20),
    remainingCigarettes: integer('remaining_cigarettes').notNull(),
    notes: text('notes'),
  },
  (table) => [index('idx_supply_inventory_purchased_at').on(table.purchasedAt)],
);

export const pauseEvents = sqliteTable(
  'pause_events',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    createdAt: integer('created_at').notNull(),
    triggerEmotion: text('trigger_emotion').notNull(),
    resisted: integer('resisted').notNull().default(1),
    notes: text('notes'),
  },
  (table) => [index('idx_pause_events_created_at').on(table.createdAt)],
);

export type UserProfile = typeof userProfile.$inferSelect;
export type NewUserProfile = typeof userProfile.$inferInsert;
export type SmokeLog = typeof smokeLogs.$inferSelect;
export type NewSmokeLog = typeof smokeLogs.$inferInsert;
export type SupplyInventoryItem = typeof supplyInventory.$inferSelect;
export type NewSupplyInventoryItem = typeof supplyInventory.$inferInsert;
export type PauseEvent = typeof pauseEvents.$inferSelect;
export type NewPauseEvent = typeof pauseEvents.$inferInsert;
