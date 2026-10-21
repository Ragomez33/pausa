# Quickstart: Validate Notification Stability

## Prerequisites

- App running on an Android device/emulator with notification support.
- A saved profile (e.g. 20 cigarettes/day → 48-minute idle interval).
- Permission to inspect scheduled alarms (`adb shell dumpsys alarm | Select-String com.pausa.app`).

## 1. Anchored idle reminder

1. Postpone a craving at T (or record a session).
2. Open the app at T+10 and T+30 without recording habit activity.
3. **Expected**: the pending `idle-reminder` still targets approximately T+48; it is not moved forward.
4. Background the app at T+30.
   **Expected**: exactly one reminder pending for approximately T+48.

## 2. Re-arm after delivery

1. Let the reminder fire while the app is closed.
2. Reopen the app.
   **Expected**: a new reminder is scheduled one interval from now (no duplicate, no orphan shot).
3. Open/close the app repeatedly.
   **Expected**: the pending reminder count stays at 0 or 1.

## 3. Orphan session cleanup

1. Start a smoking session, then force-stop the app.
2. Wait at least 30 minutes.
3. Relaunch.
   **Expected**: the `active_smoking_session` row is gone, no `smoking-session:` prompts remain, and an idle reminder is scheduled.
4. Repeat with a session started 5 minutes ago.
   **Expected**: the session is preserved and idle reminders stay suspended.

## 4. Session foreground fallback

1. Start a session and lock the device for 31 minutes.
2. Unlock and reopen the app on the session screen.
3. **Expected**: the elapsed timer shows ~31 minutes, one card announces the 30-minute boundary, and dismissing it removes the card.
4. **Expected**: future prompts (35–60) are re-scheduled; past ones are skipped.

## 5. Exact-alarm guidance (Android 12+)

1. Fresh install (or clear app data), grant notification permission.
2. **Expected**: one informational message explains Ajustes › Alarmas y recordatorios. It does not reappear after the next launch.
3. Deny notification permission instead.
   **Expected**: no exact-alarm message.

## 6. Automated checks

```bash
npx tsc --noEmit
npx expo lint
npm test
```

## Success checklist

- [ ] Idle reminder anchored to the last real interaction
- [ ] Foreground does not cancel or restart a pending reminder
- [ ] Missing reminder is re-armed on the next lifecycle event
- [ ] Orphan session cleared at cold start; recent session preserved
- [ ] Foreground card announces the latest 5-minute boundary
- [ ] Remaining session prompts re-scheduled on foreground
- [ ] Exact-alarm guidance once per installation, after permission
- [ ] Single pending idle reminder at all times
- [ ] Typecheck, lint and tests pass
