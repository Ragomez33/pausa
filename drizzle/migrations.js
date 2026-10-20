// This file is required for Expo/React Native SQLite migrations - https://orm.drizzle.team/quick-sqlite/expo

import journal from './meta/_journal.json';
import m0000 from './0000_oval_red_hulk.sql';
import m0001 from './0001_high_hellcat.sql';
import m0002 from './0002_local_persistence_routing.sql';
import m0003 from './0003_inventory_logs.sql';
import m0004 from './0004_user_badges.sql';
import m0005 from './0005_awareness_teams.sql';
import m0006 from './0006_teams_challenges.sql';
import m0007 from './0007_team_sync_outbox.sql';
import m0008 from './0008_active_smoking_session.sql';
import m0009 from './0009_personal_cloud_sync.sql';

export default {
  journal,
  migrations: {
    m0000,
    m0001,
    m0002,
    m0003,
    m0004,
    m0005,
    m0006,
    m0007,
    m0008,
    m0009,
  },
};
