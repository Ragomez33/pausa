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

## 3. Session timer and prompt

1. Watch the session timer for a few seconds.
2. **Expected**: elapsed time increases live and the UI remains responsive.
3. Wait for five minutes.
4. **Expected**: a prompt asks "¿Terminaste?"; choose "Seguir".
5. **Expected**: the timer continues and the prompt returns after the next five-minute interval.

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
2. **Expected**: no event and no inventory change.

## 7. Notifications

1. With a profile and permission granted, trigger reminder scheduling from Home.
2. **Expected**: interval matches `max(30, 16 × 60 / daily_cigarettes)` minutes, schedules stay within 08:00–22:00, and the message is exactly "Tienes ganas de fumar? Abre la app antes de encenderlo."
3. Reopen Home.
   **Expected**: no duplicate schedules.
4. Deny permission and reopen.
   **Expected**: the app works and reminders are disabled with a clear explanation.

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
- [ ] Live timer and five-minute prompt
- [ ] Session records exact duration, inventory decrement, today's count
- [ ] Empty inventory and abandoned session edge cases behave
- [ ] Reminder interval/message/waking-window/dedupe/permission behavior
- [ ] Team schema and ranking stubs
- [ ] All processing local; lint/typecheck/tests pass
