# Quickstart: Validate Teams & Level Challenges

End-to-end validation guide. See `data-model.md` and `contracts/` for formulas and interface details. Implementation details belong in `tasks.md`.

## Prerequisites

- Dependencies installed (`npm install`).
- App running on a simulator/device (`npx expo start -c`).
- A saved profile with a known daily cigarette average.

## 0. Reach the squad from home

1. Open home and locate the header navigation pills.
2. Tap "Equipo".
   **Expected**: `/team` opens; the pill shows a clear inactive state on home while the active home pill remains distinguishable.

## 0b. Tabs and back navigation

1. Open `/team` from the fixed top tabs.
2. Confirm the Equipo tab is active and no redundant back button appears.
3. Open `/team/create`, `/team/join`, and a team detail route.
4. Confirm each sub-screen shows a back-arrow header and section title, and tap the arrow.

**Expected**: The main team screen is reached through the tab bar; sub-screens return to the previous screen, falling back to home from a deep link.

## 1. Create a team

1. Open `/team`, then choose "Crear equipo".
2. Enter a name, choose duration 14 days and level Medio.
3. **Expected**: the daily-limit preview equals `floor(dailyCigarettes × 0.75)`.
4. Submit.
5. **Expected**: a team is created with a 6-character uppercase invite code; the creator appears as `leader` with the calculated limit; the dashboard opens.
6. Submit with an empty name, zero duration, or missing level.
   **Expected**: creation is blocked with a message and no rows are written.

## 2. Join by code

1. Open `/team`, choose "Unirme con código".
2. Enter the invite code in lowercase with surrounding spaces.
3. **Expected**: the code is normalized and the matching local team is found; a member row is added with the calculated limit and `member` role.
4. Submit the same code again.
   **Expected**: no duplicate membership.
5. Submit an unknown/malformed code.
   **Expected**: a clear error and an explanation that only local teams can be joined.

## 3. Dashboard summary

1. Seed two members with known snapshots.
2. Open `/team`.
3. **Expected**: team name, level label, duration/remaining days, invite code, and member count are shown.
4. **Expected**: collective postponements equal the sum of member snapshots; avoided cigarettes equal that sum; money saved equals `avoided / 20 × pack_cost`.
5. **Expected**: each member shows smoked-today vs daily limit; zero snapshots show empty/zero states.
6. Remove all teams.
   **Expected**: the empty state offers create/join.

## 4. Leaderboard

1. Seed members with different postponed counts, streaks, and stumble flags.
2. Open the dashboard.
3. **Expected**: Guardián = highest postponed; Inquebrantable = highest streak; Resiliente = highest streak among stumbled members still at/under their limit.
4. Create ties.
   **Expected**: the winner is stable by user name then id.
5. Seed no eligible member for a distinction.
   **Expected**: that card shows an empty state.

## 5. Profile and edge cases

1. Open `/team` without a profile.
   **Expected**: redirect to onboarding.
2. Use a profile with zero daily cigarettes.
   **Expected**: the daily limit is 0 and no division errors occur.
3. Simulate a storage failure during create/join.
   **Expected**: no partial team/member and a clear error.

## 6. Local-only verification

1. Disable the network and repeat create/join/dashboard.
2. **Expected**: everything works with no network requests; an invite code from another device cannot be resolved and the app explains why.

## 7. Automated checks

```bash
npm run lint
npm run typecheck
npm test
```

## Success checklist

- [ ] Home "Equipo" navigation opens `/team`
- [ ] The main team screen uses the fixed tab bar without a back button
- [ ] Team sub-screens show a back-arrow header with a working back action
- [ ] Team + leader created atomically with unique code and calculated limit
- [ ] Join by normalized code; duplicates and unknown codes blocked
- [ ] Dashboard metadata, collective metrics, and per-member today/limit
- [ ] Leaderboard distinctions and deterministic ties
- [ ] Empty states and profile guard
- [ ] Zero-average and storage-failure behavior
- [ ] Local-only operation
- [ ] Lint, typecheck, and tests pass
