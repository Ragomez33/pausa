# Quickstart: Validate Badges & Milestones

End-to-end validation guide. See `data-model.md` and `contracts/` for conditions and interface details. Implementation details belong in `tasks.md`.

## Prerequisites

- Dependencies installed (`npm install`).
- App running on a simulator/device (`npx expo start -c`).
- A saved profile and a way to seed/clear local pause events.

## 1. Empty collection

1. Open `/badges` with no activity.
2. **Expected**: all six catalog badges appear locked, muted, with 0% progress; the unlocked count is 0.

## 2. First pause

1. Record a resisted pause and return Home.
2. **Expected**: a lightweight confirmation names “Primer paso”.
3. Open `/badges`.
4. **Expected**: “Primer paso” is unlocked with a localized unlock date; no progress bar is shown.
5. Revisit Home and `/badges` without new activity.
6. **Expected**: no repeated unlock confirmation and no duplicate row.

## 3. Pause count milestone

1. Seed or record five resisted pauses.
2. Evaluate by opening Home or `/badges`.
3. **Expected**: “Primer paso” and “Cinco pausas” are unlocked; progress for five pauses is complete.

## 4. Time milestones

1. Seed a profile creation timestamp more than one day ago and no ceded event.
2. Open `/badges`.
3. **Expected**: “Un día limpio” is unlocked.
4. Seed more than seven days and more than thirty days.
5. **Expected**: the week and month badges unlock at their thresholds; locked streak badges show capped progress.
6. Add a recent ceded event.
7. **Expected**: previously unlocked time badges remain unlocked; locked streak progress restarts from the ceded event.

## 5. Savings milestone

1. Seed activity/profile values that produce estimated savings of at least 10 units.
2. Open Home or `/badges`.
3. **Expected**: “Ahorrador” unlocks; below the threshold it remains locked with proportional progress.

## 6. Idempotency and unknown keys

1. Run Home focus several times in a row.
2. **Expected**: no duplicates and no repeated confirmations.
3. Seed a `user_badges` row with an unknown key.
4. Open `/badges`.
5. **Expected**: the unknown key is ignored; the six catalog cards render normally.

## 7. Failure and profile guard

1. Simulate a storage read/write failure during evaluation.
2. **Expected**: a clear error/toast appears, existing unlocks remain intact, and the app continues.
3. Open `/badges` without a profile.
4. **Expected**: redirect to `/onboarding`.

## 8. Automated checks

```bash
npm run lint
npm run typecheck
npm test
```

## Success checklist

- [ ] Six catalog badges render exactly once with locked/unlocked states
- [ ] Unlocked badges show localized unlock date; locked badges show capped progress
- [ ] Evaluation runs automatically on Home and badges focus
- [ ] Eligible badges unlock retroactively for existing users
- [ ] Repeated evaluation creates no duplicates and preserves unlock time
- [ ] New unlocks show one confirmation; no confirmation otherwise
- [ ] Streak resets do not revoke earned badges
- [ ] Unknown stored keys are ignored
- [ ] All processing remains local
- [ ] Lint, typecheck, and tests pass
