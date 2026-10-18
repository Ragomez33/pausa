import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

import * as schema from './schema';

export const DATABASE_NAME = 'pausa.db';

export const expoDatabase = openDatabaseSync(DATABASE_NAME);

export const db = drizzle(expoDatabase, { schema });
