# Quickstart: Validate Supabase Team Sync

End-to-end validation guide. See `data-model.md` and `contracts/` for the schema and APIs. Implementation details belong in `tasks.md`.

## Prerequisites

- Dependencies installed (`npm install`), including `@supabase/supabase-js`.
- A Supabase project with the SQL in `supabase/migrations/0001_team_sync.sql` applied (tables, indexes, RLS, realtime for `shared_events`).
- `.env` containing:
  ```text
  EXPO_PUBLIC_SUPABASE_URL=...
  EXPO_PUBLIC_SUPABASE_ANON_KEY=...
  ```
- A saved profile and a local active team.
- A second client/device or the Supabase dashboard to insert shared events.

## 1. Disabled configuration

1. Remove the env values and launch the app.
2. **Expected**: all individual features work; team dashboard shows sharing as disabled; no network requests are made.

## 2. Offline queue

1. Configure Supabase, then disable the device network.
2. Create/join a team locally, postpone a cigarette, and complete a smoking session.
3. **Expected**: all local actions succeed; two pending outbox rows exist with `team_id`, `user_name`, `event_type`, and timestamp; no `trigger_emotion` is stored.
4. Restart the app.
5. **Expected**: both pending rows survive.

## 3. Flush and retry

1. Restore connectivity and foreground the app or open the dashboard.
2. **Expected**: the queue is flushed FIFO; each event appears once in `shared_events`; rows are marked `sent`.
3. Repeat the flush.
4. **Expected**: no duplicate remote rows (idempotent by event id).
5. Simulate a mid-flush failure.
   **Expected**: the failed row remains pending/failed and retries later; local data is unchanged.

## 4. Realtime dashboard

1. Keep the squad dashboard open.
2. Insert a `shared_events` row for the active team from another client/dashboard.
3. **Expected**: within a few seconds the collective counters, member metrics, and leaderboard update without navigation.
4. Insert a `posponed` event for another member and a `smoked` event for another member.
   **Expected**: Guardián/Inquebrantable/Resiliente update accordingly.
5. Insert a row with the same event id as a local event.
   **Expected**: it is counted once.
6. Switch teams or leave the screen.
   **Expected**: the previous channel is removed.

## 5. Sync status

1. Inspect the dashboard while config is missing, offline with pending events, syncing, and synced.
2. **Expected**: the status banner shows disabled/pending/offline/syncing/synced correctly and never blocks interaction.
3. Revoke RLS permission or use a bad key.
   **Expected**: a non-blocking error status appears; queued/local data remains intact.

## 6. Privacy

1. Inspect the outbox rows and outgoing `shared_events` inserts.
2. **Expected**: no `trigger_emotion`, notes, or individual history fields are present; `trigger_emotion` remains null/unused.

## 7. Individual offline guarantee

1. Disable the network and exercise onboarding, awareness loop, smoking session, inventory, history, badges, and reminders.
2. **Expected**: all individual features work exactly as before; only team sharing is affected.

## 8. Automated checks

```bash
npm run lint
npm run typecheck
npm test
```

## Success checklist

- [ ] Config disabled path leaves app fully usable
- [ ] Offline actions enqueue durable, privacy-safe events
- [ ] Queue survives restart and flushes exactly once
- [ ] Failures retry without blocking or losing data
- [ ] Realtime updates counters/leaderboard and cleans up
- [ ] Local echoes deduplicated
- [ ] Sync status visible and accurate
- [ ] No trigger emotions/notes transmitted
- [ ] Individual features fully functional offline
- [ ] Lint, typecheck, and tests pass
