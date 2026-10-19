# Quickstart: Validate Smart Idle Notifications

End-to-end validation guide. See `data-model.md` and `contracts/` for formulas and interface details. Implementation details belong in `tasks.md`.

## Prerequisites

- Dependencies installed (`npm install`).
- App running on a simulator/device with notification support (`npx expo start -c`).
- A saved profile with a known daily cigarette average.
- A way to inspect pending local notifications and channel settings (device settings or development tooling).

## 1. Permission and channel

1. Clear app notification permission and launch the app.
2. **Expected**: the app requests permission asynchronously; the loading screen/first screen is not blocked.
3. Grant permission on Android.
4. **Expected**: channel `idle-reminders` exists with high importance, vibration, and sound.

## 2. Interval calculation

1. Set the profile to 20 cigarettes/day.
2. Trigger scheduling.
3. **Expected**: one pending notification scheduled roughly 48 minutes later.
4. Test 40/day (≈30 min, clamped) and 1/day (240 min, clamped).
5. **Expected**: intervals always stay between 30 and 240 minutes.

## 3. Exact content

1. Inspect the pending notification.
2. **Expected**:
   - Title: `Pausa consciente 🛑`
   - Body: `¿Tienes ganas de fumar? Abre la app antes de encenderlo.`

## 4. Resets

1. With a reminder pending, open the app / return from background.
   **Expected**: the previous reminder is cancelled and exactly one new reminder is scheduled.
2. Confirm a postponement.
   **Expected**: the timer resets the same way.
3. Complete a smoking session.
   **Expected**: the timer resets the same way.
4. Trigger several resets quickly.
   **Expected**: at most one pending reminder remains.

## 5. Permission denied

1. Deny notification permission and launch the app.
2. **Expected**: no reminder is scheduled, the app works normally, and one non-blocking message explains reminders are disabled.
3. Re-enable permission in settings and return to the app.
4. **Expected**: the next reset/initialization schedules a reminder without reinstalling.

## 6. No profile / zero average

1. Launch without a profile.
   **Expected**: no reminder is scheduled.
2. Test a zero or invalid daily average.
   **Expected**: interval uses 240 minutes rather than dividing by zero.

## 7. Local-only verification

1. Run the app with network disabled.
2. **Expected**: permission, scheduling, cancellation, and delivery all work; no backend or remote push traffic.

## 8. Automated checks

```bash
npm run lint
npm run typecheck
npm test
```

## Success checklist

- [ ] Permission requested asynchronously at startup/onboarding
- [ ] High-importance Android channel with vibration/sound
- [ ] Interval formula and 30–240 clamp correct
- [ ] Exactly one pending reminder with the exact title/body
- [ ] Resets on app open/foreground/background, postponement, and session completion
- [ ] At most one pending reminder after rapid resets
- [ ] Denied/unavailable permission handled without blocking
- [ ] No profile → no schedule; zero average → maximum interval
- [ ] Completely local with no remote push/backend
- [ ] Lint, typecheck, and tests pass
