import { useCallback, useEffect, useRef, useState } from 'react';

import { AppState } from 'react-native';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';

import migrations from '../../../drizzle/migrations';
import { db, expoDatabase } from '@/db/client';
import { userProfile } from '@/db/schema';
import type { DatabaseInitializedState } from '@/shared/types/global';

const BOOTSTRAP_SQL = `
CREATE TABLE IF NOT EXISTS \`user_profile\` (
  \`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  \`daily_cigarettes\` integer NOT NULL,
  \`pack_cost\` real NOT NULL,
  \`currency\` text NOT NULL,
  \`quit_goal\` text NOT NULL,
  \`created_at\` text NOT NULL,
  \`postponed_count\` integer DEFAULT 0 NOT NULL
);
CREATE TABLE IF NOT EXISTS \`pause_events\` (
  \`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  \`timestamp\` text NOT NULL,
  \`trigger_emotion\` text NOT NULL,
  \`resisted\` integer NOT NULL,
  \`notes\` text
);
CREATE INDEX IF NOT EXISTS \`idx_pause_events_timestamp\` ON \`pause_events\` (\`timestamp\`);
CREATE TABLE IF NOT EXISTS \`inventory_logs\` (
  \`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  \`timestamp\` text NOT NULL,
  \`action_type\` text NOT NULL,
  \`quantity\` integer NOT NULL,
  \`cost\` real
);
CREATE INDEX IF NOT EXISTS \`idx_inventory_logs_timestamp\` ON \`inventory_logs\` (\`timestamp\`);
CREATE TABLE IF NOT EXISTS \`user_badges\` (
  \`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  \`badge_key\` text NOT NULL,
  \`unlocked_at\` text NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS \`idx_user_badges_badge_key\` ON \`user_badges\` (\`badge_key\`);
CREATE TABLE IF NOT EXISTS \`smoking_events\` (
  \`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  \`timestamp\` text NOT NULL,
  \`trigger_emotion\` text NOT NULL,
  \`duration_seconds\` integer NOT NULL,
  \`inventory_decremented\` integer NOT NULL
);
CREATE INDEX IF NOT EXISTS \`idx_smoking_events_timestamp\` ON \`smoking_events\` (\`timestamp\`);
CREATE TABLE IF NOT EXISTS \`teams\` (
  \`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  \`name\` text NOT NULL,
  \`goal_level\` text NOT NULL,
  \`duration_days\` integer NOT NULL,
  \`created_at\` text NOT NULL
);
CREATE TABLE IF NOT EXISTS \`team_members\` (
  \`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  \`team_id\` integer NOT NULL,
  \`local_name\` text NOT NULL,
  \`daily_limit\` integer NOT NULL,
  \`status\` text NOT NULL
);
CREATE INDEX IF NOT EXISTS \`idx_team_members_team_id\` ON \`team_members\` (\`team_id\`);
`;

function toError(caught: unknown): Error {
  return caught instanceof Error ? caught : new Error('No se pudo inicializar la base de datos local.');
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
