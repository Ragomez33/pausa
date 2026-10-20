# Quickstart: Validate Tabaco & Fuego Theme

**Feature**: `012-tabaco-fuego-theme`
**Purpose**: End-to-end validation guide for the warm palette, navigation, intervention action, and design reference.

## Prerequisites

- Dependencies installed with `npm install`.
- A saved profile so the home screen renders metrics.
- A simulator or device available for visual checks.
- Ability to reset or seed local data if a team or inventory state is needed.

## 1. Start the app

```bash
npx expo start -c
```

Open the app on Android and iOS (or the primary target device).

**Expected**: The app boots without Metro resolution errors and the first screen uses the soft cream background with white cards rather than navy or dark surfaces.

## 2. Static legacy-color audit

Run from the repository root:

```bash
rg -n "bg-slate-|text-slate-|border-slate-|bg-emerald-|text-emerald-|border-emerald-|bg-blue-|text-blue-|border-blue-|bg-cyan-|text-cyan-|border-cyan-|bg-teal-|text-teal-|border-teal-|bg-green-|text-green-|border-green-|#10b981|#0f172a" app src
```

**Expected**: No matches in view or layout files. Results in documentation or legacy migration notes are acceptable only if explicitly intended.

## 3. Home visual hierarchy

1. Open `/`.
2. Confirm the page background is `#F8F6F4`, cards are `#FFFFFF`, and borders are `#E5E0DA`.
3. Confirm headings use deep brown `#1A1412` and secondary copy uses gray-brown `#6E655F`.
4. Confirm cards have a soft shadow and remain clearly separated from the cream page.
5. Confirm only the current-streak card and today resisted/ceded summary appear above the action.
6. Confirm "Quiero fumar" is a large centered orange circle with a cigarette icon and white bold text, with no subtitle.
6. Tap "Quiero fumar".

**Expected**: The existing `/pause` intervention opens. The action remains readable in normal and pressed states.

## 4. Navigation and Equipo

1. On home, inspect the fixed top tab bar.
2. Confirm the order is Inicio, Historial, Inventario, Logros, Equipo and that all five equal-width tabs fit without horizontal scrolling.
3. Confirm the active tab uses a brand-orange fill with white text and inactive tabs use white cards with gray-brown text.
4. Tap Historial, Inventario, and Logros; confirm each destination opens immediately.
5. Tap Equipo.

**Expected**: `/team` opens. All five tabs stay visible, Equipo is 100% visible, and main views show no redundant back button.

6. Switch rapidly between all five tabs, including returning to previously visited tabs.
   **Expected**: No blank, white, or black flash; previously visited tab state remains mounted and the cream background is continuous.

## 5. Narrow-width navigation

1. Run the app on the narrowest supported phone profile or simulator width.
2. Inspect the fixed top tab bar.

**Expected**: All five equal-width tabs fit on screen without horizontal scrolling; Equipo is fully visible and no label is clipped or wrapped into an unreadable size.

## 6. Inventory screen

1. Open `/inventory`.
2. Confirm the page, cards, back pill, and forms use the warm palette.
3. Confirm the conscious-reflection card uses amber/orange rather than a conventional low-stock warning.
4. Confirm the purchase action is orange with white text and the consumption action is a secondary white card.
5. Register a purchase and a consumption using existing flows.

**Expected**: Styling changes only; stock, spending, validation, forms, and saving behavior remain correct.

## 7. Remaining primary screens

Visit each screen and confirm the warm palette:

- `/onboarding` (use a fresh profile or reset local data)
- `/pause`
- `/history`
- `/badges`
- `/team`, `/team/create`, `/team/join`
- `/smoking-session` (enter through the awareness flow)

**Expected**: No navy, mint, or dark-mode surfaces remain. Positive/achievement states use deep amber; alerts and primary actions use orange/deep ember. No data behavior changes are visible.

## 8. Contrast check

Verify these foreground/background combinations:

| Foreground | Background | Minimum |
|------------|------------|---------|
| Brown `#1A1412` | Background `#F8F6F4` | 4.5:1 |
| Gray-brown `#6E655F` | Background `#F8F6F4` | 4.5:1 |
| Brown `#1A1412` | Card `#FFFFFF` | 4.5:1 |
| Gray-brown `#6E655F` | Card `#FFFFFF` | 4.5:1 |
| Deep ember `#C2410C` | Background `#F8F6F4` | 4.5:1 |
| Deep ember `#C2410C` | Card `#FFFFFF` | 4.5:1 |
| Deep amber `#B45309` | Background `#F8F6F4` | 4.5:1 |
| White `#FFFFFF` | Deep ember `#C2410C` | 4.5:1 |

**Expected**: All combinations pass. Small orange text on light surfaces uses `accent-strong`, and white text is only used on orange/amber fills.

## 9. Design reference

Open `system-design.md` at the repository root.

**Expected**: It documents the palette, token roles, surface ordering, borders, radii, backgrounds, typography, navigation states, action states, status roles, contrast rules, and the token-sync governance rule.

## 10. Automated checks

```bash
npx tsc --noEmit
npm run lint
npm test
npx expo export --platform android --clear
```

**Expected**:

- 0 TypeScript errors.
- 0 lint errors.
- All Jest suites and tests pass.
- Android export completes without Metro resolution errors.

## Success Checklist

- [ ] No legacy navy, mint, blue, cyan, teal, or green classes remain in views/layout.
- [ ] Page, card, border, and text tokens match the light Tabaco & Fuego values.
- [ ] White cards have defined borders and soft shadows over the cream page.
- [ ] Fixed tab bar has all five destinations, including Equipo, fit without horizontal scrolling.
- [ ] Tapping Equipo opens `/team`; main views show no redundant back button.
- [ ] Tab switching shows no blank/white/black flash and keeps visited screens mounted.
- [ ] Active navigation pill uses orange with white text and is clearly distinguishable.
- [ ] "Quiero fumar" is a large centered orange circle with a cigarette icon and white bold text, and still opens `/pause`.
- [ ] Home shows only streak and today-summary metrics; secondary metrics are visible in History/Statistics.
- [ ] Inventory reflection and actions use the warm light palette.
- [ ] All primary screens use the warm light palette.
- [ ] Contrast checks pass.
- [ ] `system-design.md` exists and is complete.
- [ ] Typecheck, lint, tests, and Android export pass.
- [ ] No SQLite, Drizzle, hook, or calculation behavior changed.
