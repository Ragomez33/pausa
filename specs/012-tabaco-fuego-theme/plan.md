# Implementation Plan: Tabaco & Fuego Warm Theme

**Branch**: `012-tabaco-fuego-theme` | **Date**: 2026-10-19 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/012-tabaco-fuego-theme/spec.md`

## Summary

Introduce the light Tabaco & Fuego visual language by defining a semantic warm palette in NativeWind/Tailwind, migrating the existing dark/navy/mint surfaces to a soft cream page, white cards, deep brown text, and ember orange accents, while preserving current product behavior. The home header keeps five navigation pills including Equipo (`/team`), with an orange active state and white label/icon contrast. The "Quiero fumar" action remains the primary ember intervention surface on a light page. A root `system-design.md` records tokens, ordering, borders, backgrounds, and component guidance for future iterations. No SQLite, Drizzle, hook, calculation, or navigation-destination behavior changes.

## Technical Context

**Language/Version**: TypeScript 5.9, React 19.1, React Native 0.81.5, Expo SDK 54, Expo Router 6

**Primary Dependencies**: NativeWind 4.2.7, Tailwind CSS 3.4.19, lucide-react-native 1.59 through the existing centralized `src/shared/components/icons.ts` CJS bridge, react-native-svg 15.12.1

**Storage**: N/A for this feature. Existing `expo-sqlite` + Drizzle persistence remains untouched.

**Testing**: `npx tsc --noEmit`, `npm run lint`, `npm test` (Jest + jest-expo), `npx expo export --platform android` for Metro resolution, and a manual contrast/navigation audit.

**Target Platform**: iOS and Android mobile app (Expo managed), with React Native Web as a secondary target.

**Project Type**: Mobile application with thin Expo Router routes under `app/` and module views under `src/modules/`.

**Performance Goals**: No new runtime dependencies; no additional icon-set imports; maintain smooth scrolling and press feedback at 60 fps; avoid runtime color computations in render paths.

**Constraints**: Only Tailwind/NativeWind configuration, shared theme constants, visual structure, view styling, and `system-design.md` may change. SQLite queries, Drizzle schemas, hooks, metrics, and route destinations must remain unchanged. NativeWind `className` remains the primary styling mechanism; `style` is limited to shadows/glows and icon color props where NativeWind cannot reach.

**Scale/Scope**: 7 semantic color roles plus `accent-strong`, pressed, and white companion values; 13 module views, the root layout, and shared icon/theme constants; 5 navigation destinations; no new screens.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Requirement | Status |
|------|-------------|--------|
| Local-first and privacy | Theme changes must not read, write, sync, or expose domain data | PASS — no persistence or network changes |
| Drizzle/SQLite authority | Persistence remains through Drizzle over SQLite; no AsyncStorage for domain entities | PASS — data layer untouched |
| Thin Router | Files under `app/` only import and render module views | PASS — routes unchanged |
| NativeWind ownership | Styling must use NativeWind/Tailwind `className` unless justified | PASS — palette moves to Tailwind tokens; `style` stays limited to documented glow shadows and icon color props |
| Centralized iconography | Icons use `lucide-react-native` through a central module | PASS — reuse `src/shared/components/icons.ts` built for the Metro CJS constraint |
| Constants location | Static UI mappings/tokens live outside component files | PASS — global theme values go in `src/shared/constants/theme.ts`; Tailwind tokens live in `tailwind.config.js` |
| Strict typing | No `any` or unguarded `unknown`; explicit return types | PASS — plan uses typed token objects and existing view signatures |
| Accessibility and contrast | Text must remain readable on light surfaces | PASS — validated pairs: brown `#1A1412` on `#F8F6F4` = 16.90:1, gray-brown `#6E655F` on `#F8F6F4` = 5.28:1, deep ember `#C2410C` on `#F8F6F4` = 4.80:1, deep amber `#B45309` on `#F8F6F4` = 4.66:1 |
| No new dependencies | Avoid package installs for a visual theme | PASS — no installs required |
| SDD sequence | Spec approved before plan; tasks follow plan | PASS — plan is generated from the accepted spec |

**Post-design re-check:** All gates remain PASS. The feature is presentation-only, uses existing navigation semantics, and introduces no schema, hook, or query changes.

## Project Structure

### Documentation (this feature)

```text
specs/012-tabaco-fuego-theme/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   ├── theme-tokens.md
│   ├── navigation.md
│   └── screens.md
└── checklists/
    └── requirements.md
```

`tasks.md` is generated later by `/speckit.tasks`; it is not created by this command.

### Source Code (repository root)

```text
tailwind.config.js                    # Semantic Tabaco & Fuego color tokens
global.css                            # Existing Tailwind layers; expected unchanged
system-design.md                      # Canonical design reference for future iterations

app/
├── _layout.tsx                       # Loading/error surfaces warm palette
└── ...

src/
├── shared/
│   ├── constants/
│   │   └── theme.ts                  # Runtime hex values for icons and style props
│   └── components/
│       └── icons.ts                  # Existing lucide CJS bridge
└── modules/
    ├── dashboard/views/DashboardScreen.tsx
    ├── inventory/views/InventoryScreen.tsx
    ├── awareness/views/AwarenessLoopScreen.tsx
    ├── badges/views/BadgesScreen.tsx
    ├── history/views/{HistoryScreen,StatsSummary,TriggerBreakdown}.tsx
    ├── onboarding/views/OnboardingScreen.tsx
    ├── smoking/views/SmokingSessionScreen.tsx
    └── team/views/{TeamScreen,CreateTeamScreen,JoinTeamScreen,Leaderboard}.tsx
```

**Structure Decision**: Keep the existing Expo Router + module-view architecture. Add one shared design-token constant module and one root design-reference document; all other edits are in-place view styling and `tailwind.config.js`. No new screens, routes, hooks, or data modules.

## Complexity Tracking

No constitution violations or justified exceptions. The change deliberately reuses the existing navigation, icon bridge, and view structure rather than introducing a component library or theme provider.

## Phase 0: Outline & Research

Research tasks and decisions are recorded in [research.md](./research.md):

1. Define the token architecture and Tailwind/NativeWind key names.
2. Validate contrast pairs for cream, ash, orange, and amber.
3. Establish the legacy-to-theme migration map for slate/emerald classes.
4. Confirm the navigation active-state and narrow-width behavior.
5. Decide how icon colors consume theme values.
6. Define the audit and validation strategy.

## Phase 1: Design & Contracts

Design artifacts:

- [data-model.md](./data-model.md) — token entities, surfaces, navigation state, validation rules.
- [contracts/theme-tokens.md](./contracts/theme-tokens.md) — token names, values, and usage rules.
- [contracts/navigation.md](./contracts/navigation.md) — five destinations, active/inactive/pressed states, route behavior.
- [contracts/screens.md](./contracts/screens.md) — visual surface contract for each primary screen and the intervention action.
- [quickstart.md](./quickstart.md) — end-to-end validation steps and expected outcomes.

## Implementation Outline

1. Add the light semantic colors and `accent-strong`/white companions to `tailwind.config.js`.
2. Add `src/shared/constants/theme.ts` for icon/style hex values and document the sync rule.
3. Create `system-design.md` at the repository root with palette, visual order, surfaces, borders, radii, typography, navigation, action states, and migration guidance.
4. Restyle `DashboardScreen` first: cream background, white cards with soft shadows, dark typography, nav pills, streak hero, feedback banner, and ember "Quiero fumar" action.
5. Restyle `InventoryScreen`: white summary cards, conscious-reflection card, back pill, quick actions, and forms.
6. Migrate remaining views and the root loading/error surfaces from dark/slate/emerald to the light warm palette.
7. Run `rg` audit for legacy navy/mint classes, then typecheck, lint, tests, and an Android export bundle.

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Missing a screen leaves navy/mint/dark styling | Run a repository-wide `rg` audit for `slate-`, `emerald-`, `blue-`, `cyan-`, `teal-`, `green-`, and dark surface tokens before completion |
| Small orange text fails contrast on cream | Use `accent-strong #C2410C` for small orange text; reserve `brand-orange` for fills, borders, and glows |
| White cards blend into the page | Use `border-card` plus a soft card shadow on every white card |
| Icon colors drift from Tailwind tokens | Centralize runtime hex values in `src/shared/constants/theme.ts` and document the sync rule in `system-design.md` |
| Deep-screen changes accidentally touch hooks | Restrict edits to `views/`, `tailwind.config.js`, shared theme constants, and documentation; review diffs by path |
| Tabs clip on narrow devices | Use five equal-width `flex-1` tabs with compact vertical icon+label anatomy and no horizontal ScrollView; validate at the narrowest supported width |
| Future contributors invent new colors | Make `system-design.md` the canonical reference and require updates when tokens change |
