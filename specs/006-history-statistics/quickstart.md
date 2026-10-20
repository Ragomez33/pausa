# Quickstart: Validate History & Statistics

End-to-end validation guide. See `data-model.md` and `contracts/` for formulas and interface details. Implementation details belong in `tasks.md`.

## Prerequisites

- Dependencies installed (`npm install`).
- App running on a simulator/device (`npx expo start -c`).
- A saved profile and several pause events (mixed triggers, outcomes, and notes).

## 1. Empty history

1. Open `/history` with no pause events.
2. **Expected**: the list and trigger breakdown show clear empty states; success rate shows “Sin datos”; the streak still counts from profile creation.

## 2. Event list

1. Seed events with different timestamps, triggers, outcomes, and notes.
2. Open `/history`.
3. **Expected**: events appear newest first; each row shows localized date/time, readable trigger, resisted/ceded status, and notes only when present.
4. Seed two events with the same timestamp.
   **Expected**: ordering is stable across reloads.

## 3. Success rate and streak

1. Seed 3 resisted and 1 ceded event.
   **Expected**: success rate shows 75%.
2. Remove the ceded event (or seed a dataset with none).
   **Expected**: the streak starts at profile creation.
3. Add a recent ceded event.
   **Expected**: the streak restarts from that event and shows days/hours.
4. Set the device clock behind a stored timestamp.
   **Expected**: elapsed time never shows a negative value.
5. Seed a profile with a known daily average and pack cost, plus inventory purchases with costs.
   **Expected**: the statistics panel shows avoided cigarettes, money saved, and inventory spending matching the stored data.

## 4. Trigger breakdown

1. Seed 3 anxiety, 1 stress, and 0 boredom events.
2. Open the breakdown.
3. **Expected**: anxiety appears first with count 3 and 75%; stress second with count 1 and 25%; boredom is absent; bar lengths are proportional.
4. Seed a historical event with `work_stress` or `coffee_social`.
   **Expected**: a readable label is shown, not the raw code.

## 5. Large history

1. Seed at least 1,000 events.
2. Open and scroll the history.
3. **Expected**: the first meaningful view appears within 2 seconds and scrolling remains smooth; the list renders incrementally.

## 6. Navigation and refresh

1. From Home, tap “Historial”.
   **Expected**: `/history` opens.
2. Record a new pause event, then return to history.
   **Expected**: the new event and updated aggregates appear without an app restart.

## 7. Failure and profile guard

1. Simulate a storage read failure.
   **Expected**: a clear error state is shown; no stale analytics remain.
2. Remove the profile (fresh install) and open `/history`.
   **Expected**: redirect to `/onboarding`.

## 8. Automated checks

```bash
npm run lint
npm run typecheck
npm test
```

## Success checklist

- [ ] Events newest first with date/time, trigger, status, and optional notes
- [ ] Success rate correct, zero-event safe
- [ ] Active streak follows profile/last-ceded rule and never negative
- [ ] Avoided cigarettes, money saved, and inventory spending are visible and correct
- [ ] Trigger counts/percentages and bars correct and ordered
- [ ] Legacy/unknown trigger codes show readable labels
- [ ] Empty/error/profile states handled
- [ ] Long history remains smooth
- [ ] No network calls or heavy chart dependencies
- [ ] Lint, typecheck, and tests pass
