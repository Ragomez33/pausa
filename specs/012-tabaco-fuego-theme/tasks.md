# Tasks: Tabaco & Fuego Warm Theme

**Input**: Design documents from `/specs/012-tabaco-fuego-theme/`

**Prerequisites**: `plan.md` (required), `spec.md` (required), `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: One small unit test for the shared theme token values is included because the constitution requires tests for implemented code. Visual and navigation behavior is validated through `quickstart.md`; no new data or calculation tests are required because the feature is presentation-only.

**Organization**: Tasks are grouped by user story. The palette foundation is shared; each story then delivers an independently testable visual increment.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: `[US1]`, `[US2]`, `[US3]`, `[US4]` for user-story phases; omitted in Setup, Foundational, and Polish
- Every task includes the exact file path(s) it touches

## Path Conventions

- Mobile app with Expo Router: `app/`, `src/modules/`, `src/shared/`.
- Tests: `src/shared/tests/unit/`.
- Design reference: repository-root `system-design.md`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the project supports the visual change without dependency or data-layer changes.

- [X] T001 [P] Review `tailwind.config.js`, `global.css`, `metro.config.js`, and `package.json`; confirm NativeWind/Tailwind are configured, the lucide CJS icon bridge remains in place, and no new dependency is needed.
- [X] T002 [P] Review `src/db/`, `drizzle/`, and `src/modules/*/hooks/`; record that no SQLite schema, Drizzle query, hook, metric, or route-destination change is part of this feature.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Define the theme tokens and their typed runtime counterpart before touching screens.

**⚠ CRITICAL**: No screen restyling starts until these tasks are complete.

- [X] T003 Update `tailwind.config.js` with the light semantic colors `background: '#F8F6F4'`, `card: '#FFFFFF'`, `border-card: '#E5E0DA'`, `text-primary: '#1A1412'`, `text-secondary: '#6E655F'`, `brand-orange: '#FF5722'`, `accent: '#FF5722'`, `accent-strong: '#C2410C'`, `accent-pressed: '#C2410C'`, `brand-amber: '#B45309'`, and `white: '#FFFFFF'`.
- [X] T004 [P] Create `src/shared/constants/theme.ts` exporting a strictly typed `THEME_COLORS` object with the same primary and companion values for icon, spinner, and shadow props.
- [X] T005 [P] Create `src/shared/tests/unit/theme.test.ts` asserting every `THEME_COLORS` value matches the palette contract in `contracts/theme-tokens.md`.

**Checkpoint**: Tailwind and runtime tokens are available; user-story work can begin.

---

## Phase 3: User Story 1 - Experience a Cohesive Warm Identity (Priority: P1) 🎯 MVP

**Goal**: Replace navy and mint styling across the primary screens with the Tabaco & Fuego surfaces, borders, and text roles.

**Independent Test**: Open Dashboard, Inventory, Onboarding, History, Badges, Team, Pause, and Smoking Session; confirm page/card/border/text roles match `contracts/theme-tokens.md` and no legacy navy or mint class remains.

- [X] T006 [P] [US1] Restyle the base Dashboard surface in `src/modules/dashboard/views/DashboardScreen.tsx`: page background, brand label, streak hero, metric cards, feedback banner, and glow shadows to warm tokens; leave the navigation pills for T018 and the "Quiero fumar" action for T021.
- [X] T007 [P] [US1] Restyle `src/modules/inventory/views/InventoryScreen.tsx`: page, back pill, summary cards, conscious-reflection card, quick actions, forms, and saving/disabled states to warm tokens while preserving all hook behavior.
- [X] T008 [P] [US1] Restyle `src/modules/awareness/views/AwarenessLoopScreen.tsx`: background, breathing visual, trigger chips, cards, and primary/secondary actions to brand amber/orange with white text on bright fills.
- [X] T009 [P] [US1] Restyle `src/modules/onboarding/views/OnboardingScreen.tsx`: page, inputs, option cards, selected chips, and continuation action to warm tokens.
- [X] T010 [P] [US1] Restyle `src/modules/history/views/HistoryScreen.tsx`, `src/modules/history/views/StatsSummary.tsx`, and `src/modules/history/views/TriggerBreakdown.tsx`: page, cards, resisted/ceded states, and bars to amber/orange roles.
- [X] T011 [P] [US1] Restyle `src/modules/badges/views/BadgesScreen.tsx`: page, progress card, unlocked/locked achievement states, and progress bars to warm tokens.
- [X] T012 [P] [US1] Restyle `src/modules/team/views/TeamScreen.tsx`, `src/modules/team/views/CreateTeamScreen.tsx`, `src/modules/team/views/JoinTeamScreen.tsx`, and `src/modules/team/views/Leaderboard.tsx`: backgrounds, cards, selected chips, submit actions, invite-code accents, member bars, and empty states.
- [X] T013 [P] [US1] Restyle `src/modules/smoking/views/SmokingSessionScreen.tsx`: page, session card, primary completion action, and secondary action to warm tokens.
- [X] T014 [P] [US1] Restyle `app/_layout.tsx`: loading/error surfaces to `bg-background`, error copy to `brand-orange`, secondary error text to `text-secondary`, and `ActivityIndicator` to `THEME_COLORS.brandOrange`.
- [X] T015 [P] [US1] Restyle `src/shared/components/PlaceholderScreen.tsx` with a `bg-background` root and `text-primary`/`text-secondary` copy so placeholder routes match the theme.
- [X] T016 [US1] Run `npx tsc --noEmit`, `npm run lint`, and `npm test`; verify 0 errors and no changes to data-layer behavior before closing US1.

**Checkpoint**: US1 is independently demonstrable as the full warm visual migration (MVP).

---

## Phase 4: User Story 2 - Reach the Squad from the Main Navigation (Priority: P2)

**Goal**: Keep all five destinations visible, make the active pill unmistakable, and open `/team` from Equipo.

**Independent Test**: On home, verify the five labels and active state, tap Equipo, and confirm `/team` opens; repeat at the narrowest supported width.

- [X] T017 [US2] Verify and, if needed, update `src/modules/dashboard/utils/navigation.ts` so `DASHBOARD_NAV_ITEMS` contains exactly Inicio (`/`), Historial (`/history`), Inventario (`/inventory`), Logros (`/badges`), and Equipo (`/team`) in that order.
- [X] T018 [US2] Update the navigation pill markup in `src/modules/dashboard/views/DashboardScreen.tsx`: active `bg-brand-orange` + `text-white` + white icon, inactive `bg-card` + `border-border-card` + `text-secondary`, and pressed feedback that keeps labels readable.
- [X] T019 [US2] Confirm the Equipo item routes to `/team`; this initial scrollable-header implementation was superseded by the fixed `MainTabBar` in T044–T045.
- [X] T020 [US2] Run `npx tsc --noEmit`, `npm run lint`, and `npm test`; verify the other four destinations still navigate and behavior is unchanged.

**Checkpoint**: US2 works independently once the Dashboard base exists.

---

## Phase 5: User Story 3 - Recognize the Impulse Intervention Instantly (Priority: P3)

**Goal**: Make "Quiero fumar" the primary ember intervention surface while preserving the existing pause flow.

**Independent Test**: Open home, confirm the action uses brand orange and is the most prominent control, press it, and confirm `/pause` opens with visible pressed feedback.

- [X] T021 [US3] Restyle the "Quiero fumar" block in `src/modules/dashboard/views/DashboardScreen.tsx` with a `brand-orange` border, subtle orange wash, white icon on an orange tile, `accent-strong` eyebrow, and a restrained ember glow; keep it the most prominent home action.
- [X] T022 [US3] Verify the action still calls `router.push('/pause')` and that pressed, disabled, and icon states remain readable; adjust only the intervention markup/classes in `src/modules/dashboard/views/DashboardScreen.tsx`.
- [X] T023 [US3] Run `npx tsc --noEmit`, `npm run lint`, and `npm test`; confirm the pause flow and all existing metrics remain unchanged.

**Checkpoint**: US3 works independently once the Dashboard base exists.

---

## Phase 6: User Story 4 - Preserve Design Decisions for Future Work (Priority: P4)

**Goal**: Document the complete design language so future screens and tokens remain consistent.

**Independent Test**: Read `system-design.md` and confirm it contains every required section and matches the values in `tailwind.config.js` and `src/shared/constants/theme.ts`.

- [X] T024 [P] [US4] Create `system-design.md` at the repository root with brand intent, token table, surface ordering, borders/radii/shadows, typography, navigation states, action/intervention states, status roles, contrast rules, migration map, and token-governance/sync rule.
- [X] T025 [US4] Cross-check `system-design.md` against `tailwind.config.js` and `src/shared/constants/theme.ts`; ensure all three sources list identical token names and hex values and that the sync rule is explicit.

**Checkpoint**: US4 is independently reviewable as a documentation deliverable.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Audit, validate, and close the visual migration.

- [X] T026 [P] Run a repository-wide audit with `rg` for `bg-slate-`, `text-slate-`, `border-slate-`, `emerald-`, `blue-`, `cyan-`, `teal-`, `green-`, and hardcoded cool-palette hex values in `app/` and `src/`.
- [X] T027 [P] Fix any remaining legacy colors or hardcoded cool hex values found by T026 in the affected view/style files.
- [X] T028 [P] Audit contrast pairs from `contracts/theme-tokens.md` and confirm cream is never used on orange/amber and that active/inactive navigation states remain distinguishable.
- [ ] T029 Execute the manual scenarios in `specs/012-tabaco-fuego-theme/quickstart.md` on a simulator/device and record the results.
  - _Status: blocked pending a simulator/device. Automated equivalents passed: static color audit, typecheck, lint, 164 Jest tests, and Android export bundle._
- [X] T030 Run `npx tsc --noEmit`, `npm run lint`, and `npm test`; confirm 0 errors and all tests passing.
- [X] T031 Run `npx expo export --platform android --clear`; confirm Metro bundles successfully and no icon-resolution error returns.
- [X] T032 Run `git status` for the repository root, summarize changed files, and present the suggested commit command for user confirmation (constitution §5.9). Do NOT commit or push automatically.

---

## Phase 8: Light Mode Revision

**Purpose**: Replace the initial dark/warm surface exploration with the requested light-mode palette while preserving all behavior and navigation.

- [X] T033 [P] Update `tailwind.config.js` to the light palette: `background '#F8F6F4'`, `card '#FFFFFF'`, `border-card '#E5E0DA'`, `text-primary '#1A1412'`, `text-secondary '#6E655F'`, `brand-orange '#FF5722'`, `accent-strong '#C2410C'`, `accent-pressed '#C2410C'`, `brand-amber '#B45309'`, and `white '#FFFFFF'`.
- [X] T034 [P] Update `src/shared/constants/theme.ts` and `src/shared/tests/unit/theme.test.ts` to the light palette, adding `accentStrong` and `white` while removing the obsolete dark `ink` token.
- [X] T035 [US1] Update view classes so bright orange/amber fills use white text/icons, small orange text uses `accent-strong`, cards are white with `border-card` and soft shadows, and page backgrounds use the cream token.
- [X] T036 [US4] Rewrite `system-design.md` for the light palette, including surface ordering, soft shadows, token roles, navigation states, action states, contrast pairs, and governance.
- [X] T037 [P] Re-run the legacy-color and cold-hex audit, and confirm no `text-ink`, dark background, navy, mint, or bright-amber text remains.
- [X] T038 Run `npx tsc --noEmit`, `npm run lint`, `npm test`, and `npx expo export --platform android --clear`; confirm the light theme builds and all tests pass.
  - _Result: 0 type errors, 0 lint errors, 164 Jest tests passing, Android bundle exported successfully._

---

## Phase 9: Dashboard Focus

**Purpose**: Reduce home to the essential metrics and one centered action, and move secondary metrics into History/Statistics.

- [X] T039 [P] [US1] Simplify `src/modules/dashboard/views/DashboardScreen.tsx` to the current-streak card and today resisted/ceded summary only; remove avoided cigarettes, money saved, inventory spending, and pack cards.
- [X] T040 [US3] Replace the intervention block with a large brand-orange `rounded-full` circle centered in the available space, containing a cigarette icon and white bold "Quiero fumar" text with no subtitle.
- [X] T041 [US1] Remove the four filler phrases and keep only the navigation, essential metrics, optional feedback banner, and central action on home.
- [X] T042 [P] [US4] Add avoided cigarettes, money saved, and inventory spending to `src/modules/history/views/StatsSummary.tsx` so the secondary metrics remain available outside the dashboard.
- [X] T043 Run `npx tsc --noEmit`, `npm run lint`, `npm test`, and an Android export; confirm the simplified layout and history summary build correctly.

---

## Phase 10: Persistent Top Tab Bar

- [X] T044 [P] Create `src/shared/constants/tabs.ts` and `src/shared/components/MainTabBar.tsx` with five equal-width tabs, no horizontal ScrollView, active orange styling, and `router.replace` navigation.
- [X] T045 [US1] Replace the Dashboard's scrollable nav with `MainTabBar` and add the fixed bar to `/history`, `/inventory`, `/badges`, and `/team`.
- [X] T046 [US1] Remove redundant "Volver" controls from the main tab views; keep `SectionHeader` back navigation only on `/team/create`, `/team/join`, and `/team/[id]`.
- [X] T047 Run `npx tsc --noEmit`, `npm run lint`, `npm test`, and an Android export; confirm all five tabs fit and the fixed bar builds correctly.

---

## Phase 11: Tab Transition Performance

- [X] T048 Move the five main routes into `app/(tabs)/` and create `app/(tabs)/_layout.tsx` with an Expo Router `Tabs` navigator, hidden built-in tab bar, `lazy: false`, and neutral transition animation.
- [X] T049 Set `sceneStyle` and the root Stack `contentStyle` to the theme background, and wrap the root layout in `bg-background` to prevent white/black frames during transitions.
- [X] T050 Change `MainTabBar` to use `router.navigate` for sibling tabs so visited tab screens stay mounted instead of being replaced and rebuilt.
- [X] T051 Run `npx tsc --noEmit`, `npm run lint`, `npm test`, and an Android export; confirm the tab transition layout and route manifest build correctly.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup; blocks all user stories.
- **US1 (Phase 3)**: Depends on Foundational.
- **US2 (Phase 4)**: Depends on US1 because it edits the Dashboard file after the base restyle.
- **US3 (Phase 5)**: Depends on US1; follows US2 because it edits the same Dashboard file.
- **US4 (Phase 6)**: Depends on Foundational; can run in parallel with US1–US3.
- **Polish (Phase 7)**: Depends on all user stories.

### Key Task Dependencies

- T001/T002 → T003/T004 → T005.
- T003/T004 → T006–T015.
- T006 → T018 → T021 (same Dashboard file).
- T003/T004 → T024 → T025.
- T016, T020, T023 → T026–T032.

### Within Each User Story

- Tokens before screen styling.
- Base Dashboard before navigation and intervention refinements.
- Run `tsc` + lint + Jest before closing each story.
- Documentation values must match the code sources before US4 closes.

---

## Parallel Opportunities

- **Setup**: T001 and T002.
- **Foundational**: T004 and T005 after T003.
- **US1**: T006–T015 are different files and can run in parallel once tokens exist.
- **US4**: T024 can run alongside US1–US3 after tokens exist.
- **Polish**: T026, T027, and T028 can start in parallel after all stories; T029–T032 follow.

### Parallel Example: User Story 1

```text
Task: "Restyle InventoryScreen" (T007)
Task: "Restyle AwarenessLoopScreen" (T008)
Task: "Restyle OnboardingScreen" (T009)
Task: "Restyle History views" (T010)
Task: "Restyle BadgesScreen" (T011)
Task: "Restyle Team views" (T012)
Task: "Restyle SmokingSessionScreen" (T013)
Task: "Restyle app/_layout.tsx" (T014)
Task: "Restyle PlaceholderScreen" (T015)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Setup (T001–T002).
2. Complete Foundational (T003–T005).
3. Complete US1 (T006–T016).
4. **STOP and VALIDATE** with the US1 independent test and `quickstart.md` visual checks.
5. Demo the full warm palette across primary screens.

### Incremental Delivery

1. Setup + Foundational → tokens ready.
2. US1 → warm identity across all screens (MVP).
3. US2 → five-pill navigation with a strong active state and `/team` access.
4. US3 → ember intervention action.
5. US4 → canonical `system-design.md`.
6. Polish → static audit, contrast check, typecheck, lint, tests, Android export, commit proposal.

### Parallel Team Strategy

1. One developer completes Setup + Foundational.
2. Once tokens exist:
   - Developer A: Dashboard base (T006) then navigation (T018) then intervention (T021).
   - Developer B: Inventory, Awareness, Onboarding (T007–T009).
   - Developer C: History, Badges, Team, Smoking Session, shared surfaces (T010–T015).
   - Developer D: `system-design.md` (T024–T025).
3. Integrate, then run the audit and validation tasks together.

---

## Notes

- `[P]` marks different files with no dependency on an incomplete task.
- Story labels map to the user stories in `spec.md`.
- The feature is presentation-only: do not edit `src/db/`, `drizzle/`, hooks, schemas, metrics, or route destinations.
- Reuse `src/shared/components/icons.ts`; do not import the lucide package root because Metro excludes `.mjs` entries.
- Use `THEME_COLORS` for icon/spinner/shadow values; use Tailwind classes for everything else.
- Keep existing copy, data, validation, and navigation behavior unchanged.
