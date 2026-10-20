import { index, integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const userProfile = sqliteTable('user_profile', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  dailyCigarettes: integer('daily_cigarettes').notNull(),
  packCost: real('pack_cost').notNull(),
  currency: text('currency').notNull(),
  quitGoal: text('quit_goal').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  ownerUserId: text('owner_user_id'),
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
    syncId: text('sync_id').notNull(),
    ownerUserId: text('owner_user_id'),
    timestamp: text('timestamp').notNull(),
    actionType: text('action_type').notNull(),
    quantity: integer('quantity').notNull(),
    cost: real('cost'),
  },
  (table) => [
    index('idx_inventory_logs_timestamp').on(table.timestamp),
    uniqueIndex('idx_inventory_logs_sync_id').on(table.syncId),
  ],
);

export const smokingEvents = sqliteTable(
  'smoking_events',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    syncId: text('sync_id').notNull(),
    ownerUserId: text('owner_user_id'),
    timestamp: text('timestamp').notNull(),
    triggerEmotion: text('trigger_emotion').notNull(),
    durationSeconds: integer('duration_seconds').notNull(),
    inventoryDecremented: integer('inventory_decremented').notNull(),
  },
  (table) => [
    index('idx_smoking_events_timestamp').on(table.timestamp),
    uniqueIndex('idx_smoking_events_sync_id').on(table.syncId),
  ],
);

export const activeSmokingSession = sqliteTable('active_smoking_session', {
  id: text('id').primaryKey(),
  triggerEmotion: text('trigger_emotion').notNull(),
  startedAtMs: integer('started_at_ms').notNull(),
  createdAt: text('created_at').notNull(),
});

export const teams = sqliteTable(
  'teams',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    inviteCode: text('invite_code').notNull(),
    difficultyLevel: text('difficulty_level').notNull(),
    durationDays: integer('duration_days').notNull(),
    createdAt: text('created_at').notNull(),
  },
  (table) => [uniqueIndex('idx_teams_invite_code').on(table.inviteCode)],
);

export const teamMembers = sqliteTable(
  'team_members',
  {
    id: text('id').primaryKey(),
    teamId: text('team_id')
      .notNull()
      .references(() => teams.id, { onDelete: 'cascade' }),
    userName: text('user_name').notNull(),
    dailyLimit: integer('daily_limit').notNull(),
    role: text('role').notNull(),
    joinedAt: text('joined_at').notNull(),
    postponedCount: integer('postponed_count').notNull().default(0),
    smokedToday: integer('smoked_today').notNull().default(0),
    streakDays: integer('streak_days').notNull().default(0),
    hadStumble: integer('had_stumble').notNull().default(0),
  },
  (table) => [index('idx_team_members_team_id').on(table.teamId)],
);

export const teamEventOutbox = sqliteTable(
  'team_event_outbox',
  {
    id: text('id').primaryKey(),
    teamId: text('team_id').notNull(),
    userName: text('user_name').notNull(),
    eventType: text('event_type').notNull(),
    timestamp: text('timestamp').notNull(),
    status: text('status').notNull(),
    attempts: integer('attempts').notNull().default(0),
    lastError: text('last_error'),
    createdAt: text('created_at').notNull(),
  },
  (table) => [
    index('idx_team_event_outbox_status').on(table.status, table.createdAt),
  ],
);

export const userBadges = sqliteTable(
  'user_badges',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    syncId: text('sync_id').notNull(),
    ownerUserId: text('owner_user_id'),
    badgeKey: text('badge_key').notNull(),
    unlockedAt: text('unlocked_at').notNull(),
  },
  (table) => [
    uniqueIndex('idx_user_badges_owner_badge').on(table.ownerUserId, table.badgeKey),
    uniqueIndex('idx_user_badges_sync_id').on(table.syncId),
  ],
);

export const pauseEvents = sqliteTable(
  'pause_events',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    syncId: text('sync_id').notNull(),
    ownerUserId: text('owner_user_id'),
    timestamp: text('timestamp').notNull(),
    triggerEmotion: text('trigger_emotion').notNull(),
    resisted: integer('resisted').notNull(),
    notes: text('notes'),
  },
  (table) => [
    index('idx_pause_events_timestamp').on(table.timestamp),
    uniqueIndex('idx_pause_events_sync_id').on(table.syncId),
  ],
);

export const globalSyncOutbox = sqliteTable(
  'global_sync_outbox',
  {
    id: text('id').primaryKey(),
    entityType: text('entity_type').notNull(),
    entityId: text('entity_id').notNull(),
    payload: text('payload').notNull(),
    status: text('status').notNull(),
    attempts: integer('attempts').notNull().default(0),
    lastError: text('last_error'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    uniqueIndex('idx_global_sync_outbox_entity').on(table.entityType, table.entityId),
    index('idx_global_sync_outbox_status').on(table.status, table.createdAt),
  ],
);

export const syncState = sqliteTable('sync_state', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: text('updated_at').notNull(),
});

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
export type ActiveSmokingSession = typeof activeSmokingSession.$inferSelect;
export type NewActiveSmokingSession = typeof activeSmokingSession.$inferInsert;
export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
export type TeamMember = typeof teamMembers.$inferSelect;
export type NewTeamMember = typeof teamMembers.$inferInsert;
export type TeamEventOutbox = typeof teamEventOutbox.$inferSelect;
export type NewTeamEventOutbox = typeof teamEventOutbox.$inferInsert;
export type GlobalSyncOutbox = typeof globalSyncOutbox.$inferSelect;
export type NewGlobalSyncOutbox = typeof globalSyncOutbox.$inferInsert;
export type SyncState = typeof syncState.$inferSelect;
export type NewSyncState = typeof syncState.$inferInsert;
