# Quickstart: Validate Onboarding & Pause Flow

End-to-end validation guide for this feature. See `data-model.md` for schema and `contracts/` for
interface details. Implementation lives in `tasks.md` and the codebase.

## Prerequisites

- Dependencies installed (`npm install`).
- App running on a simulator/device (`npx expo start -c`).
- A clean local database state for the first-run scenario (or complete the reset step below).

## 1. First-run onboarding

1. Launch the app with no stored profile.
2. **Expected**: you are redirected to `/onboarding`.
3. Submit with empty/invalid numeric fields.
   **Expected**: submission is blocked and the error is shown via a toast (no inline field text).
4. Enter valid values (daily cigarettes > 0, pack cost ≥ 0, currency, optional goal) and complete.
   **Expected**: profile is saved locally and you are replaced onto `/` (home).

## 2. Home dashboard

1. With a profile present, open `/`.
   **Expected**: the central "Pausa" button and metrics are shown.
2. Compare metrics with the stored records.
   **Expected**: money saved and streak/count are derived from real events (zero-state when none).
3. Relaunch the app with a profile present.
   **Expected**: no onboarding; straight to home.

## 3. Pause flow

1. From home, tap the Pausa button.
   **Expected**: `/pause` opens and a reflection timer starts.
2. Try to confirm an outcome while the timer runs.
   **Expected**: outcome controls are disabled until the timer completes.
3. After the timer, select a trigger and choose "Logré pausar" (resisted) or "Cedí" (ceded).
   **Expected**: a pause event is saved locally and the user returns/navigates home.
4. Return home.
   **Expected**: metrics reflect the new event.
5. Repeat step 1 and leave the flow before confirming.
   **Expected**: no new event is persisted.

## 4. Automated checks

```bash
npm run typecheck   # tsc --noEmit -> 0 errors
npm test            # jest -> all pass (schema, metrics, mappers)
```

## Success checklist

- [ ] No profile → redirected to onboarding
- [ ] Invalid onboarding input blocked with toast
- [ ] Valid onboarding saves profile and lands on home
- [ ] Home metrics computed from stored data (no hardcoding)
- [ ] Reflection timer gates outcome capture
- [ ] Resisted/ceded event persisted and reflected in home
- [ ] Leaving pause flow early persists nothing
- [ ] `tsc --noEmit` = 0 errors, `npm test` all pass
