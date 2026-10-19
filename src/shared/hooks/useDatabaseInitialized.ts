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
  \`created_at\` text NOT NULL
);
CREATE TABLE IF NOT EXISTS \`pause_events\` (
  \`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  \`timestamp\` text NOT NULL,
  \`trigger_emotion\` text NOT NULL,
  \`resisted\` integer NOT NULL,
  \`notes\` text
);
CREATE INDEX IF NOT EXISTS \`idx_pause_events_timestamp\` ON \`pause_events\` (\`timestamp\`);
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
