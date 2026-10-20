# Quickstart: Validate Personal Data Cloud Backup

End-to-end validation guide. See `data-model.md` and `contracts/` for schema and APIs. Implementation details belong in `tasks.md`.

## Prerequisites

- Dependencies installed, including the announced `expo-secure-store` and `expo-crypto`.
- A Supabase project with:
  - `supabase/migrations/0001_team_sync.sql` already applied;
  - `supabase/migrations/0002_personal_data_sync.sql` applied;
  - Email auth enabled;
  - redirect URL `pausa://auth/callback` allowed.
- `.env` containing:
  ```text
  EXPO_PUBLIC_SUPABASE_URL=...
  EXPO_PUBLIC_SUPABASE_ANON_KEY=...
  ```
- A saved local profile and some local history.
- A second device/emulator or a way to clear/reinstall the app.

## 1. Guest mode

1. Launch with no authenticated session.
2. **Expected**: onboarding/local features work; the account screen shows Guest Mode; no personal network requests are made.
3. Record a pause, a smoking session, a purchase, and a consumption.
4. **Expected**: every local screen updates immediately; no backup rows are uploaded.

## 2. Enable account and backup

1. Open `/account`, enter an email, and request a magic link.
2. Open the link on the device.
3. **Expected**: the callback exchanges the code, the account is authenticated, and the local data adoption prompt appears.
4. Choose "Adopt local data".
5. **Expected**: guest rows receive the account ownership, backup is still off by default, and no upload happens until consent.
6. Enable "Respaldo personal".
7. **Expected**: if the account already has remote data, restore runs first; backfill then enqueues only local-only or newer rows. The status moves through pending/syncing/synced.

## 3. Emotional consent

1. With backup enabled but emotional consent off, record a pause with a trigger.
2. Inspect the outbox payload and remote `smoking_events`.
3. **Expected**: `trigger_emotion` and `notes` are `null`.
4. Enable "Compartir disparadores emocionales".
5. Record another pause.
6. **Expected**: the new payload includes the trigger and notes; previously sent rows are unchanged.

## 4. Offline queue and retry

1. Disable the device network.
2. Record two pauses and one session.
3. **Expected**: local writes succeed instantly; three pending backup rows exist; the status shows pending/offline.
4. Kill and restart the app.
5. **Expected**: pending rows survive.
6. Restore connectivity and foreground the app.
7. **Expected**: rows upload in a batch, status becomes synced, and each personal row appears exactly once in Supabase.

## 5. Partial-batch failure

1. Make one payload invalid (for example, temporarily remove a required field in a test build).
2. Flush a batch containing valid and invalid rows.
3. **Expected**: valid rows are marked sent; the invalid row remains failed/pending; local data is intact; retry does not duplicate valid rows.

## 6. New-device restore

1. Clear the app data or use a fresh install.
2. Sign in with the same account and enable backup.
3. **Expected**: profile, pause/smoking events, inventory movements, and achievements are downloaded in pages and hydrated into SQLite.
4. Navigate while restore runs.
5. **Expected**: no blocking full-screen spinner caused by the network; local data appears incrementally.
6. Kill the app mid-restore and relaunch.
7. **Expected**: restore resumes from checkpoints without duplicates.

## 7. Local-newer precedence

1. On device A, record a new event while offline.
2. On device B, sync an older profile change.
3. Bring device A online and run restore.
4. **Expected**: the newer local profile/event is preserved; remote-only records are added; no local rows are deleted.

## 8. Account isolation

1. Sign in as account B on a device that has account A rows.
2. **Expected**: account A rows are hidden from personal screens and are not uploaded under B.
3. Attempt a direct remote read/write against A's rows with B's session.
4. **Expected**: RLS denies the request.
5. Sign back into A.
6. **Expected**: A's rows reappear and sync resumes.

## 9. Disable backup / sign out

1. Disable backup.
2. Record new personal activity.
3. **Expected**: local writes succeed; no new personal rows are enqueued or uploaded.
4. Sign out.
5. **Expected**: local data remains available offline; no uploads occur; cloud data is untouched.

## 10. Failure and misconfiguration

1. Remove the Supabase environment values and launch.
2. **Expected**: backup status is disabled; no personal network calls; all local features work.
3. Use an invalid/expired auth session.
4. **Expected**: a non-blocking error appears; queued data remains; local features continue.

## 11. Automated checks

```bash
npm run lint
npm run typecheck
npm test
```

## Success checklist

- [ ] Guest mode is local-only and fully functional
- [ ] Magic-link sign-in and account linking work
- [ ] Backup is opt-in and off by default
- [ ] Emotional fields require explicit consent
- [ ] Local writes are instant and never wait for the network
- [ ] Queue survives restart and flushes exactly once
- [ ] Partial failures preserve successful and failed rows correctly
- [ ] Restore hydrates a new device without overwriting newer local data
- [ ] Account isolation is enforced by RLS and local scope
- [ ] Disabling backup/sign-out stops uploads without deleting data
- [ ] No blocking spinners caused by sync/restore
- [ ] Lint, typecheck, and tests pass

## Validation notes

- 2026-10-20: local migrations `0000–0009` validated with `node:sqlite`.
- 2026-10-20: `0002_personal_data_sync.sql` applied to the remote project with
  `supabase db push`. Cross-account RLS denial must still be exercised with two
  authenticated sessions; the SQL policies are in place.
- 2026-10-20: `0003_personal_data_grants.sql` applied. The tables had RLS policies but the
  `authenticated` role lacked table grants, causing PostgREST `42501 permission denied`.
  Verified `SELECT/INSERT/UPDATE` grants and `auth.uid()` policies for all four personal tables.
- Device/emulator scenarios remain pending until an Email Auth redirect is configured
  and a native rebuild includes `expo-secure-store`.
