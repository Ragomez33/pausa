# Quickstart: Validate Local Persistence & Startup Routing

End-to-end validation guide for this feature. See `data-model.md` for the schema and `contracts/` for
interface details. Implementation details live in `tasks.md` and the codebase.

## Prerequisites

- Dependencies installed (`npm install`).
- App running on a simulator/device (`npx expo start -c`).
- A way to reset or inspect the local database for first-run scenarios. On a simulator/device, clear the
  app's storage or uninstall/reinstall the app; in Expo Go, clear the project's local data.

## 1. First run without a profile

1. Launch the app with no stored profile.
2. **Expected**: a loading indicator is shown while storage is prepared; no home content flashes.
3. **Expected**: once ready, the app lands on `/onboarding`.
4. Submit with empty, non-numeric, zero, or negative numeric values.
   **Expected**: submission is blocked and the error appears in a toast (no inline field text).
5. Enter valid values (daily cigarettes > 0, pack cost ≥ 0, currency, goal) and submit.
   **Expected**: exactly one profile is stored and the app replaces to `/` (home).

## 2. Relaunch with a profile

1. Close and relaunch the app.
2. **Expected**: the loading indicator appears briefly, then `/` (home) opens with no onboarding.
3. Inspect the stored profile (device DB tooling or a temporary query against `pausa.db`).
   **Expected**: one row in `user_profile` with the entered values and an ISO-8601 `created_at`.

## 3. Duplicate submission / direct onboarding entry

1. Open `/onboarding` directly (or via `pausa://onboarding`) while a profile exists.
2. Submit again.
   **Expected**: no second profile row is created; the app returns to `/`.

## 4. Pause-event persistence

1. From home, open `/pause`, complete the reflection timer, choose a trigger and outcome.
2. **Expected**: a `pause_events` row is stored with an ISO-8601 `timestamp`, `trigger_emotion`,
   `resisted` as 0/1, and optional `notes`.
3. Relaunch the app and reopen the flow/home.
   **Expected**: the event remains available and historical reads are newest-first.

## 5. Failure state

1. Simulate an unavailable or corrupted local database (for example, make the DB read-only in a
   development build).
2. Launch the app.
   **Expected**: a clear error message is shown instead of the navigation stack; the app does not hang
   on the loading indicator.

## 6. Migration continuity (existing installs)

1. Install the previous build and complete onboarding; record at least one pause event.
2. Upgrade to this build and launch.
3. **Expected**: the profile and pause events are preserved, timestamps are ISO-8601 text, and home opens
   directly.

## 7. Automated checks

```bash
npm run typecheck   # tsc --noEmit -> 0 errors
npm test            # jest -> all pass (schema, mappers, metrics)
```

## Success checklist

- [ ] Loading indicator shown until storage is ready
- [ ] No profile → `/onboarding`; profile → home
- [ ] Invalid numeric input blocked with toast, no inline errors
- [ ] Exactly one profile persisted; duplicate submissions ignored
- [ ] Profile and pause events survive relaunch
- [ ] Pause events stored with ISO timestamp and DESC retrieval
- [ ] Storage failure surfaces a clear error state
- [ ] Existing records preserved through migration
- [ ] `tsc --noEmit` = 0 errors, `npm test` all pass
