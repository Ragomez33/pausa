import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';

import migrations from '../../../drizzle/migrations';
import { db } from '../db/client';
import type { DatabaseStatus } from '../types/global';

export function useDatabaseInitialized(): DatabaseStatus {
  const { success, error } = useMigrations(db, migrations);
  return { ready: success, error: error ?? null };
}
