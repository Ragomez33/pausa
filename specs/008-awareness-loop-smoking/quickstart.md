# Quickstart: Validate Awareness Loop & Smoking Session

End-to-end validation guide. See `data-model.md` and `contracts/` for formulas and interface details. Implementation details belong in `tasks.md`.

## Prerequisites

- Dependencies installed (`npm install`).
- App running on a simulator/device (`npx expo start -c`).
- A saved profile with known daily cigarettes and a way to inspect/seed local data.

## 1. Home and postpone branch

1. Open Home.
2. **Expected**: primary action says "Quiero fumar" or "Tengo ganas de fumar".
3. Tap it, choose "Sí".
4. **Expected**: one postponement is recorded, a positive message appears, Home returns, and no smoking session/event exists.
5. Repeat quickly and confirm only one increment per confirmed loop.

## 2. Continue branch

1. Tap the primary action, choose "No".
2. **Expected**: exactly four emotions appear: Ansiedad/Estrés, Aburrimiento, Costumbre, Presión Social.
3. Select an emotion.
4. **Expected**: a frank message from the bank appears with "Iniciar Cigarrillo".
5. Tap "Iniciar Cigarrillo".
   **Expected**: `/smoking-session` opens with the selected trigger.

## 3. Session timer and local notifications

1. Watch the session timer for a few seconds.
2. **Expected**: elapsed time increases live and the UI remains responsive.
3. Background the app or lock the screen and wait for five minutes.
4. **Expected**: a local system notification titled "¿Terminaste?" arrives with the elapsed-minutes body.
5. Bring the app to the foreground.
6. **Expected**: the in-app "¿Terminaste?" prompt is also visible as a reinforcement and the timer reflects real elapsed time.
7. Tap "Seguir fumando" and confirm the next notification arrives five minutes later (up to twelve prompts).

## 4. Finish session

1. Ensure inventory has at least one cigarette.
2. Tap "Terminé".
3. **Expected**: one `smoking_events` row with ISO timestamp, selected trigger, exact seconds, and `inventory_decremented = 1`.
4. **Expected**: inventory decreases by one and Home shows today's smoked count incremented.
5. Repeat rapid taps on finish.
   **Expected**: only one event is stored.

## 5. Empty inventory

1. Set inventory stock to zero.
2. Complete a session.
3. **Expected**: the session is recorded with `inventory_decremented = 0`, stock remains zero, and a clear notice is shown.

## 6. Abandoned session

1. Start a session and leave the screen without finishing.
2. **Expected**: no event and no inventory change; the `active_smoking_session` row is cleared and pending session notifications are cancelled.

## 6.1 Notification tap and stale session

1. Start a session, background the app, and wait for a session notification.
2. Tap the notification.
   **Expected**: `/smoking-session` opens with the real elapsed time reconstructed from SQLite.
3. Keep the session active for more than thirty minutes and reopen it.
   **Expected**: the app offers "Sí, terminé" or "Descartar sesión"; discarding records no event.
4. Kill the app while a session is active, then tap a pending session notification.
   **Expected**: the app cold-starts, reads the persisted session, and opens `/smoking-session`.

## 7. Notifications

1. With a profile and permission granted, trigger idle reminder scheduling from Home.
2. **Expected**: interval matches `max(30, 16 × 60 / daily_cigarettes)` minutes, and the message is exactly "Tienes ganas de fumar? Abre la app antes de encenderlo."
3. Reopen Home.
   **Expected**: no duplicate schedules.
4. Deny permission and reopen.
   **Expected**: the app works and reminders are disabled with a clear explanation.
5. Start a session while an idle reminder is pending.
   **Expected**: the idle reminder is cancelled; only session notifications remain.
6. Finish or discard the session.
   **Expected**: pending `smoking-session:` notifications disappear and an idle reminder is scheduled again.

## 8. Teams stub

1. Open `/team`.
2. **Expected**: "El Guardián", "El Inquebrantable", and "El Resiliente" sections appear; with no team data, an empty state is shown.
3. Inspect stored team data.
   **Expected**: teams have name, goal level (`facil`/`medio`/`dificil`/`modo_dios`), duration days, and creation time; members have team reference, local name, daily limit, and status.

## 9. Automated checks

```bash
npm run lint
npm run typecheck
npm test
```

## Success checklist

- [ ] Home primary action and both loop branches work
- [ ] Postponement increments once and writes no session
- [ ] Four emotions, rotating bank message, and session start
- [ ] Live timer and five-minute local notification
- [ ] Notification tap reopens the active session from SQLite
- [ ] 30-minute stale session offers finish or discard
- [ ] Session records exact duration, inventory decrement, today's count
- [ ] Empty inventory and abandoned session edge cases behave
- [ ] Reminder interval/message/waking-window/dedupe/permission behavior
- [ ] Team schema and ranking stubs
- [ ] All processing local; lint/typecheck/tests pass
