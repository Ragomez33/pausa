import { useCallback, useEffect, useRef, useState } from 'react';

import { AppState } from 'react-native';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';

import migrations from '../../../drizzle/migrations';
import { db, expoDatabase } from '@/db/client';
import { userProfile } from '@/db/schema';
import { createSyncId } from '@/shared/utils/syncIds';
import type { DatabaseInitializedState } from '@/shared/types/global';

const BOOTSTRAP_SQL = `
CREATE TABLE IF NOT EXISTS \`user_profile\` (
  \`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  \`daily_cigarettes\` integer NOT NULL,
  \`pack_cost\` real NOT NULL,
  \`currency\` text NOT NULL,
  \`quit_goal\` text NOT NULL,
  \`created_at\` text NOT NULL,
  \`updated_at\` text DEFAULT '' NOT NULL,
  \`owner_user_id\` text,
  \`postponed_count\` integer DEFAULT 0 NOT NULL
);
CREATE TABLE IF NOT EXISTS \`pause_events\` (
  \`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  \`sync_id\` text DEFAULT '' NOT NULL,
  \`owner_user_id\` text,
  \`timestamp\` text NOT NULL,
  \`trigger_emotion\` text NOT NULL,
  \`resisted\` integer NOT NULL,
  \`notes\` text
);
CREATE INDEX IF NOT EXISTS \`idx_pause_events_timestamp\` ON \`pause_events\` (\`timestamp\`);
CREATE TABLE IF NOT EXISTS \`inventory_logs\` (
  \`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  \`sync_id\` text DEFAULT '' NOT NULL,
  \`owner_user_id\` text,
  \`timestamp\` text NOT NULL,
  \`action_type\` text NOT NULL,
  \`quantity\` integer NOT NULL,
  \`cost\` real
);
CREATE INDEX IF NOT EXISTS \`idx_inventory_logs_timestamp\` ON \`inventory_logs\` (\`timestamp\`);
CREATE TABLE IF NOT EXISTS \`user_badges\` (
  \`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  \`sync_id\` text DEFAULT '' NOT NULL,
  \`owner_user_id\` text,
  \`badge_key\` text NOT NULL,
  \`unlocked_at\` text NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS \`idx_user_badges_owner_badge\` ON \`user_badges\` (\`owner_user_id\`, \`badge_key\`);
CREATE TABLE IF NOT EXISTS \`smoking_events\` (
  \`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  \`sync_id\` text DEFAULT '' NOT NULL,
  \`owner_user_id\` text,
  \`timestamp\` text NOT NULL,
  \`trigger_emotion\` text NOT NULL,
  \`duration_seconds\` integer NOT NULL,
  \`inventory_decremented\` integer NOT NULL
);
CREATE INDEX IF NOT EXISTS \`idx_smoking_events_timestamp\` ON \`smoking_events\` (\`timestamp\`);
CREATE TABLE IF NOT EXISTS \`active_smoking_session\` (
  \`id\` text PRIMARY KEY NOT NULL,
  \`trigger_emotion\` text NOT NULL,
  \`started_at_ms\` integer NOT NULL,
  \`created_at\` text NOT NULL
);
CREATE TABLE IF NOT EXISTS \`global_sync_outbox\` (
  \`id\` text PRIMARY KEY NOT NULL,
  \`entity_type\` text NOT NULL,
  \`entity_id\` text NOT NULL,
  \`payload\` text NOT NULL,
  \`status\` text NOT NULL,
  \`attempts\` integer DEFAULT 0 NOT NULL,
  \`last_error\` text,
  \`created_at\` text NOT NULL,
  \`updated_at\` text NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS \`idx_global_sync_outbox_entity\` ON \`global_sync_outbox\` (\`entity_type\`, \`entity_id\`);
CREATE INDEX IF NOT EXISTS \`idx_global_sync_outbox_status\` ON \`global_sync_outbox\` (\`status\`, \`created_at\`);
CREATE TABLE IF NOT EXISTS \`sync_state\` (
  \`key\` text PRIMARY KEY NOT NULL,
  \`value\` text NOT NULL,
  \`updated_at\` text NOT NULL
);
CREATE TABLE IF NOT EXISTS \`teams\` (
  \`id\` text PRIMARY KEY NOT NULL,
  \`name\` text NOT NULL,
  \`invite_code\` text NOT NULL,
  \`difficulty_level\` text NOT NULL,
  \`duration_days\` integer NOT NULL,
  \`created_at\` text NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS \`idx_teams_invite_code\` ON \`teams\` (\`invite_code\`);
CREATE TABLE IF NOT EXISTS \`team_members\` (
  \`id\` text PRIMARY KEY NOT NULL,
  \`team_id\` text NOT NULL,
  \`user_name\` text NOT NULL,
  \`daily_limit\` integer NOT NULL,
  \`role\` text NOT NULL,
  \`joined_at\` text NOT NULL,
  \`postponed_count\` integer DEFAULT 0 NOT NULL,
  \`smoked_today\` integer DEFAULT 0 NOT NULL,
  \`streak_days\` integer DEFAULT 0 NOT NULL,
  \`had_stumble\` integer DEFAULT 0 NOT NULL
);
CREATE INDEX IF NOT EXISTS \`idx_team_members_team_id\` ON \`team_members\` (\`team_id\`);
CREATE TABLE IF NOT EXISTS \`team_event_outbox\` (
  \`id\` text PRIMARY KEY NOT NULL,
  \`team_id\` text NOT NULL,
  \`user_name\` text NOT NULL,
  \`event_type\` text NOT NULL,
  \`timestamp\` text NOT NULL,
  \`status\` text NOT NULL,
  \`attempts\` integer DEFAULT 0 NOT NULL,
  \`last_error\` text,
  \`created_at\` text NOT NULL
);
CREATE INDEX IF NOT EXISTS \`idx_team_event_outbox_status\` ON \`team_event_outbox\` (\`status\`, \`created_at\`);
`;

function toError(caught: unknown): Error {
  return caught instanceof Error ? caught : new Error('No se pudo inicializar la base de datos local.');
}

async function ensurePersonalSyncSchema(): Promise<void> {
  const tableColumns: { table: string; column: string; definition: string }[] = [
    { table: 'user_profile', column: 'updated_at', definition: "text DEFAULT '' NOT NULL" },
    { table: 'user_profile', column: 'owner_user_id', definition: 'text' },
    { table: 'pause_events', column: 'sync_id', definition: "text DEFAULT '' NOT NULL" },
    { table: 'pause_events', column: 'owner_user_id', definition: 'text' },
    { table: 'smoking_events', column: 'sync_id', definition: "text DEFAULT '' NOT NULL" },
    { table: 'smoking_events', column: 'owner_user_id', definition: 'text' },
    { table: 'inventory_logs', column: 'sync_id', definition: "text DEFAULT '' NOT NULL" },
    { table: 'inventory_logs', column: 'owner_user_id', definition: 'text' },
    { table: 'user_badges', column: 'sync_id', definition: "text DEFAULT '' NOT NULL" },
    { table: 'user_badges', column: 'owner_user_id', definition: 'text' },
  ];

  for (const entry of tableColumns) {
    const columns = await expoDatabase.getAllAsync<{ name: string }>(
      `PRAGMA table_info(\`${entry.table}\`)`,
    );
    if (!columns.some((column) => column.name === entry.column)) {
      await expoDatabase.execAsync(
        `ALTER TABLE \`${entry.table}\` ADD COLUMN \`${entry.column}\` ${entry.definition}`,
      );
    }
  }

  await expoDatabase.execAsync(
    "UPDATE `user_profile` SET `updated_at` = `created_at` WHERE `updated_at` = ''",
  );
  await expoDatabase.execAsync('DROP INDEX IF EXISTS `idx_user_badges_badge_key`');
  await expoDatabase.execAsync(
    'CREATE UNIQUE INDEX IF NOT EXISTS `idx_user_badges_owner_badge` ON `user_badges` (`owner_user_id`, `badge_key`)',
  );

  const syncTables = ['pause_events', 'smoking_events', 'inventory_logs', 'user_badges'];
  for (const table of syncTables) {
    const rows = await expoDatabase.getAllAsync<{ id: number }>(
      `SELECT \`id\` FROM \`${table}\` WHERE \`sync_id\` = ''`,
    );
    for (const row of rows) {
      await expoDatabase.runAsync(
        `UPDATE \`${table}\` SET \`sync_id\` = ? WHERE \`id\` = ?`,
        [createSyncId(), row.id],
      );
    }
    await expoDatabase.execAsync(
      `CREATE UNIQUE INDEX IF NOT EXISTS \`idx_${table}_sync_id\` ON \`${table}\` (\`sync_id\`)`,
    );
  }
}

function readHasProfile(): boolean {
  const rows = db.select({ id: userProfile.id }).from(userProfile).limit(1).all();
  return rows.length > 0;
}

export function useDatabaseInitialized(): DatabaseInitializedState {
  const { success, error: migrationError } = useMigrations(db, migrations);
  const [ready, setReady] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [setupError, setSetupError] = useState<Error | null>(null);
  const [migrationRecovered, setMigrationRecovered] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!success) {
      return undefined;
    }

    let cancelled = false;

    async function prepare(): Promise<void> {
      try {
        await expoDatabase.execAsync(BOOTSTRAP_SQL);
        await ensurePersonalSyncSchema();
        const profileExists = readHasProfile();
        if (!cancelled && mounted.current) {
          setHasProfile(profileExists);
          setSetupError(null);
          setReady(true);
        }
      } catch (caught) {
        if (!cancelled && mounted.current) {
          setSetupError(toError(caught));
          setReady(false);
        }
      }
    }

    void prepare();

    return () => {
      cancelled = true;
    };
  }, [success]);

  useEffect(() => {
    if (!migrationError) {
      return undefined;
    }

    let cancelled = false;

    async function recoverWithBootstrap(): Promise<void> {
      try {
        await expoDatabase.execAsync(BOOTSTRAP_SQL);
        await ensurePersonalSyncSchema();
        const profileExists = readHasProfile();
        if (!cancelled && mounted.current) {
          setMigrationRecovered(true);
          setHasProfile(profileExists);
          setSetupError(null);
          setReady(true);
        }
      } catch (caught) {
        if (!cancelled && mounted.current) {
          setSetupError(toError(caught));
          setReady(false);
        }
      }
    }

    void recoverWithBootstrap();

    return () => {
      cancelled = true;
    };
  }, [migrationError]);

  const refresh = useCallback((): void => {
    if (!ready) {
      return;
    }
    try {
      const profileExists = readHasProfile();
      if (mounted.current) {
        setHasProfile(profileExists);
        setSetupError(null);
      }
    } catch (caught) {
      if (mounted.current) {
        setSetupError(toError(caught));
      }
    }
  }, [ready]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        refresh();
      }
    });
    return () => subscription.remove();
  }, [refresh]);

  const error = setupError ?? (migrationRecovered ? null : (migrationError ?? null));

  return { ready, hasProfile, error, refresh };
}
