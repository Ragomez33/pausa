# Contract: Screen Visual Surfaces

**Feature**: `012-tabaco-fuego-theme`
**Scope**: Visual-only restyling of existing views

## Global Rules

- **SS-001**: Every page root uses `bg-background`; no `bg-slate-*`, dark page backgrounds, or mint/cyan/green surfaces remain. White is reserved for `card` surfaces, not page roots.
- **SS-002**: Cards use `bg-card` with `border-border-card` and a soft shadow; nested insets may use `bg-background` or `bg-card/70`.
- **SS-003**: Primary copy uses `text-text-primary`; labels and helper copy use `text-text-secondary`; small orange text uses `text-accent-strong`.
- **SS-004**: Bright orange or amber fills use `text-white` and white icons.
- **SS-005**: Existing headings, labels, records, metrics, and navigation destinations remain unchanged unless a label must be adjusted for the new hierarchy.
- **SS-006**: Existing `style` shadows are replaced with soft card shadows and restrained ember/amber glows, or removed if decorative only.
- **SS-007**: No view may import or call a new hook, query, schema, or data helper.

## Screen Map

### `app/_layout.tsx`

- Loading and error surfaces use `bg-background`.
- Error text uses `accent-strong`; secondary error details use `text-secondary`.
- `ActivityIndicator` uses `THEME_COLORS.brandOrange`.
- Navigation stack and route registrations remain unchanged.

### `DashboardScreen`

- Page: `bg-background`.
- Brand label: `text-accent-strong`.
- Keep only two top cards: current streak and a compact today summary of resisted/ceded counts.
- Streak card: `bg-card`, `border-border-card`, soft card shadow, primary value in `text-text-primary`.
- Today card: `bg-card`, `border-border-card`; resisted value in `text-text-primary`; ceded value in `text-accent-strong`.
- Remove avoided-cigarettes, money-saved, inventory-spending, and pack cards from the dashboard.
- Feedback banner (when present): `bg-brand-amber/10`, `border-brand-amber/30`, `text-text-primary`.
- Navigation: fixed top tab bar with five equal-width tabs, active `brand-orange` + `text-white`, inactive `card`/transparent + `text-secondary`; no horizontal scroll.
- "Quiero fumar": large `rounded-full` `brand-orange` circle centered in the remaining space, with a white cigarette icon and white bold text; no subtitle.
- Remove the four filler phrases listed in the feature requirement.
- Icons: `THEME_COLORS` values.

### `InventoryScreen`

- Page: `bg-background`.
- Fixed `MainTabBar` at the top; no back action on this main view.
- Summary cards: `bg-card`, `border-border-card`; stock highlight uses `brand-amber` or `brand-orange`.
- Conscious reflection: `brand-amber` wash and border; no alarming red/amber warning.
- Purchase action: `brand-orange` fill with `text-white`; consumption action: `card` with `border-card`.
- Forms: `bg-card`, `border-border-card`, inputs on `bg-background`, `text-primary`.
- Saving/disabled states remain distinct and readable.

### `AwarenessLoopScreen` (`/pause`)

- Page: `bg-background`.
- Calming/breathing visual: `brand-amber` and `brand-orange` at low opacity; no emerald.
- Primary response action: `brand-orange` fill with `text-white`.
- Secondary action: `card` with `border-card`.
- Trigger chips and cards: `card` with `border-card`.
- Existing countdown, gating, and outcome behavior remain unchanged.

### `OnboardingScreen`

- Page and scroll surface: `bg-background`.
- Inputs and option cards: `card` with `border-card`.
- Selected option: `brand-orange` fill with `text-white`, or a strong orange border.
- Primary continuation action: `brand-orange` with `text-white`.
- Existing form validation and navigation remain unchanged.

### `HistoryScreen`, `StatsSummary`, `TriggerBreakdown`

- Page: `bg-background`.
- Fixed `MainTabBar` at the top; no back action on this main view.
- Cards: `card` with `border-card`.
- Primary stats: `text-primary`; positive/resisted states: `brand-amber`; ceded/attention states: `accent-strong`.
- Show avoided cigarettes, money saved, and inventory spending in the statistics summary because they are no longer on the dashboard.
- Bars: background `border-card`, fill `brand-amber` or `brand-orange`.
- Empty/error states use `text-primary`/`text-secondary` and `accent-strong`.

### `BadgesScreen`

- Page: `bg-background`.
- Fixed `MainTabBar` at the top; no back action on this main view.
- Progress summary card: `card` with `border-card`.
- Unlocked achievement: `brand-amber` wash/border/text.
- Locked achievement: `card` with `border-card` and `text-secondary`.
- Progress bars use `brand-amber`.

### `TeamScreen`, `CreateTeamScreen`, `JoinTeamScreen`, `Leaderboard`

- Page: `bg-background`.
- Fixed `MainTabBar` at the top; no back action on the main team view.
- Team header, member rows, rank cards: `card` with `border-card`.
- Invite code and leader accents: `accent-strong` or `brand-amber`; primary actions: `brand-orange` with `text-white`.
- Selected chips and primary submit: `brand-orange` fill with `text-white`.
- Member progress bars: `brand-amber` or `brand-orange`, not emerald.
- Empty states and create/join actions remain unchanged in behavior.

### `SmokingSessionScreen`

- Page: `bg-background`.
- Session card: `card` with `border-card`.
- Primary completion action: `brand-orange` with `text-white`.
- Secondary action: `card` with `border-card`.
- Existing session behavior remains unchanged.

## Forbidden Legacy Classes

The following MUST be absent after the migration:

```text
bg-slate-*        text-slate-*        border-slate-*
bg-emerald-*      text-emerald-*      border-emerald-*
bg-cyan-*         text-cyan-*         border-cyan-*
bg-teal-*         text-teal-*         border-teal-*
bg-green-*        text-green-*        border-green-*
bg-blue-*         text-blue-*         border-blue-*
```

`red-*` error styling is also replaced by `accent-strong` text and `brand-orange` surfaces to keep alerts inside the palette.

## Behavior Boundary

- **SS-008**: No changes to `src/db/`, `drizzle/`, module hooks, metric helpers, schemas, or route destinations.
- **SS-009**: Pressing "Quiero fumar" still opens `/pause`.
- **SS-010**: Pressing Equipo still opens `/team`.
- **SS-011**: All existing form validation, saving, and refresh behavior remains unchanged.
