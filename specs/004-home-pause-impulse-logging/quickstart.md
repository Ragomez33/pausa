# Quickstart: Validate Home Metrics & Pause Impulse Logging

End-to-end validation guide. See `data-model.md` and `contracts/` for formulas and interface details. Implementation details belong in `tasks.md`.

## Prerequisites

- Dependencies installed (`npm install`).
- App running on a simulator/device (`npx expo start -c`).
- A saved profile (complete onboarding) and a way to reset/inspect local data.

## 1. Empty history

1. Create a profile with known values (for example 10 cigarettes/day, pack cost 5.00, currency USD).
2. Open `/` with no pause events.
3. **Expected**: elapsed time since profile creation, a today summary of `0 Pausas | 0 Fumados`, and no secondary financial cards on home.

## 2. Metrics with history

1. Record one resisted and one ceded impulse with known timestamps (via the app or device DB tooling).
2. Open home.
3. **Expected**: the today summary shows `1 Pausa | 1 Fumado`, elapsed time starts from the ceded timestamp, and no avoided/money/inventory cards appear on home.
4. Open Historial.
   **Expected**: avoided cigarettes, money saved, and inventory spending are visible in the statistics summary.
5. Return home and wait at least 30 seconds.
   **Expected**: elapsed time and today summary refresh without an app restart.

## 2b. Header navigation and visual hierarchy

1. Open home and inspect the fixed top tabs.
   **Expected**: Inicio is visually active; Historial, Inventario, Logros, and Equipo are inactive but readable.
2. Confirm all five tabs fit on screen without horizontal scrolling.
   **Expected**: Equipo is 100% visible.
3. Tap Equipo.
   **Expected**: `/team` opens from the fixed tab bar with no back button.
3. Return to home.
   **Expected**: only the streak and today cards appear above a large centered orange circle with a cigarette icon and white "Quiero fumar" text.

## 3. Pause intervention and gating

1. Tap the Pausa button on home.
2. **Expected**: `/pause` opens and a breathing countdown runs for 10–15 seconds.
3. Try to select an outcome while the countdown runs.
   **Expected**: actions are disabled/blocked.
4. Leave the screen before the countdown ends and return home.
   **Expected**: no new event was stored.

## 4. Record a resisted impulse

1. Complete the countdown, select "Ansiedad", add a short note, and tap "Logré Pausar".
2. **Expected**: one event is stored with `resisted = 1`, the trigger, ISO timestamp, and note.
3. **Expected**: home opens with updated metrics and a reinforcing banner.

## 5. Record a ceded impulse and reset

1. Complete another intervention, select a trigger, and tap "Cedí / Fumé".
2. **Expected**: one event is stored with `resisted = 0`.
3. **Expected**: home elapsed time restarts from that event; lifetime resisted/ceded counts increase by one each.

## 6. Validation and duplicate protection

1. After the countdown, tap an outcome without selecting a trigger.
   **Expected**: saving is blocked with a toast.
2. Select a trigger and rapidly tap the same outcome multiple times.
   **Expected**: only one event is stored.

## 7. Zero and error states

1. Test a profile with pack cost 0 and another with daily cigarettes 0 (or seed equivalent records).
   **Expected**: money and/or avoided cigarettes show zero without crashing.
2. Simulate a storage write failure (for example, make the DB read-only in a development build).
   **Expected**: the intervention stays open, shows an error, and allows retry; no partial row exists.

## 8. Automated checks

```bash
npm run typecheck   # tsc --noEmit -> 0 errors
npm run lint        # expo lint -> no errors
npm test            # jest -> all pass
```

## Success checklist

- [ ] Home shows only streak and today-summary metrics with 0 hardcoded values
- [ ] Secondary metrics are available in History/Statistics
- [ ] Ceded event resets the streak window
- [ ] Metrics refresh on focus and periodically
- [ ] Fixed top tabs distinguish active/inactive, all five fit without horizontal scrolling, and Equipo opens `/team`
- [ ] Large centered circular Pausa action opens the intervention
- [ ] Countdown lasts 10–15 seconds and blocks outcomes
- [ ] Five trigger options and optional notes are available
- [ ] Resisted/ceded events persist with ISO timestamp and correct flag
- [ ] Duplicate taps store only one event
- [ ] Home refreshes and shows reinforcement after save
- [ ] Zero values and storage errors are handled
