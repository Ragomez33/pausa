// This file is required for Expo/React Native SQLite migrations - https://orm.drizzle.team/quick-sqlite/expo

import journal from './meta/_journal.json';
import m0000 from './0000_oval_red_hulk.sql';
import m0001 from './0001_high_hellcat.sql';
import m0002 from './0002_local_persistence_routing.sql';
import m0003 from './0003_inventory_logs.sql';
import m0004 from './0004_user_badges.sql';

export default {
  journal,
  migrations: {
    m0000,
    m0001,
    m0002,
    m0003,
    m0004,
  },
};
