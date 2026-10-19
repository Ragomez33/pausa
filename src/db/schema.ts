import { index, integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const userProfile = sqliteTable('user_profile', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  dailyCigarettes: integer('daily_cigarettes').notNull(),
  packCost: real('pack_cost').notNull(),
  currency: text('currency').notNull(),
  quitGoal: text('quit_goal').notNull(),
  createdAt: text('created_at').notNull(),
  postponedCount: integer('postponed_count').notNull().default(0),
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

export const inventoryLogs = sqliteTable(
  'inventory_logs',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    timestamp: text('timestamp').notNull(),
    actionType: text('action_type').notNull(),
    quantity: integer('quantity').notNull(),
    cost: real('cost'),
  },
  (table) => [index('idx_inventory_logs_timestamp').on(table.timestamp)],
);

export const smokingEvents = sqliteTable(
  'smoking_events',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    timestamp: text('timestamp').notNull(),
    triggerEmotion: text('trigger_emotion').notNull(),
    durationSeconds: integer('duration_seconds').notNull(),
    inventoryDecremented: integer('inventory_decremented').notNull(),
  },
  (table) => [index('idx_smoking_events_timestamp').on(table.timestamp)],
);

export const teams = sqliteTable('teams', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  goalLevel: text('goal_level').notNull(),
  durationDays: integer('duration_days').notNull(),
  createdAt: text('created_at').notNull(),
});

export const teamMembers = sqliteTable(
  'team_members',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    teamId: integer('team_id')
      .notNull()
      .references(() => teams.id, { onDelete: 'cascade' }),
    localName: text('local_name').notNull(),
    dailyLimit: integer('daily_limit').notNull(),
    status: text('status').notNull(),
  },
  (table) => [index('idx_team_members_team_id').on(table.teamId)],
);

export const userBadges = sqliteTable(
  'user_badges',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    badgeKey: text('badge_key').notNull(),
    unlockedAt: text('unlocked_at').notNull(),
  },
  (table) => [uniqueIndex('idx_user_badges_badge_key').on(table.badgeKey)],
);

export const pauseEvents = sqliteTable(
  'pause_events',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    timestamp: text('timestamp').notNull(),
    triggerEmotion: text('trigger_emotion').notNull(),
    resisted: integer('resisted').notNull(),
    notes: text('notes'),
  },
  (table) => [index('idx_pause_events_timestamp').on(table.timestamp)],
);

export type UserProfile = typeof userProfile.$inferSelect;
export type NewUserProfile = typeof userProfile.$inferInsert;
export type SmokeLog = typeof smokeLogs.$inferSelect;
export type NewSmokeLog = typeof smokeLogs.$inferInsert;
export type SupplyInventoryItem = typeof supplyInventory.$inferSelect;
export type NewSupplyInventoryItem = typeof supplyInventory.$inferInsert;
export type PauseEvent = typeof pauseEvents.$inferSelect;
export type NewPauseEvent = typeof pauseEvents.$inferInsert;
export type InventoryLog = typeof inventoryLogs.$inferSelect;
export type NewInventoryLog = typeof inventoryLogs.$inferInsert;
export type UserBadge = typeof userBadges.$inferSelect;
export type NewUserBadge = typeof userBadges.$inferInsert;
export type SmokingEvent = typeof smokingEvents.$inferSelect;
export type NewSmokingEvent = typeof smokingEvents.$inferInsert;
export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
export type TeamMember = typeof teamMembers.$inferSelect;
export type NewTeamMember = typeof teamMembers.$inferInsert;
