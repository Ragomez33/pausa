# Research: Tabaco & Fuego Light Theme

**Feature**: `012-tabaco-fuego-theme`
**Date**: 2026-10-19
**Status**: Complete — all technical unknowns resolved

## R1. Token architecture for NativeWind/Tailwind

**Decision**: Extend `tailwind.config.js` with semantic color names that mirror the design roles, plus a small set of companion keys:

```js
colors: {
  background: '#F8F6F4',
  card: '#FFFFFF',
  'border-card': '#E5E0DA',
  'text-primary': '#1A1412',
  'text-secondary': '#6E655F',
  'brand-orange': '#FF5722',
  accent: '#FF5722',
  'accent-strong': '#C2410C',
  'accent-pressed': '#C2410C',
  'brand-amber': '#B45309',
  white: '#FFFFFF',
}
```

Utility examples:

- Page surface: `bg-background`
- Card surface: `bg-card`
- Card border: `border-border-card`
- Primary copy: `text-text-primary`
- Secondary copy: `text-text-secondary`
- Primary action/intervention: `bg-brand-orange` or `border-brand-orange`
- Orange text on light surfaces: `text-accent-strong`
- Pause/achievement: `text-brand-amber` / `border-brand-amber`
- Text on orange or amber fills: `text-white`

**Rationale**: NativeWind consumes Tailwind color keys directly. Keeping the role names from the specification avoids inventing component-specific names and makes the design reference easy to map to code. `accent-strong`, `accent-pressed`, and `white` are companion values for contrast and interaction; they are not additional brand colors.

**Alternatives considered**:

- Raw hex values in every component: rejected because it causes drift and makes future theme updates expensive.
- CSS variables in `global.css` only: viable but less discoverable in NativeWind class names and adds indirection for a small fixed palette.
- A full theme provider/context: rejected as unnecessary complexity for a static brand palette.

## R2. Contrast validation

**Decision**: Use deep brown and gray-brown on cream/white surfaces, deep ember for small orange text, deep amber for progress text, and white on bright accent fills. Calculated WCAG contrast ratios:

| Foreground | Background | Ratio | Use |
|------------|------------|-------|-----|
| `#1A1412` brown | `#F8F6F4` background | 16.90:1 | Primary copy |
| `#6E655F` gray-brown | `#F8F6F4` background | 5.28:1 | Secondary copy |
| `#1A1412` brown | `#FFFFFF` card | 18.22:1 | Primary copy on cards |
| `#6E655F` gray-brown | `#FFFFFF` card | 5.69:1 | Secondary copy on cards |
| `#C2410C` deep ember | `#F8F6F4` background | 4.80:1 | Small orange text/links |
| `#C2410C` deep ember | `#FFFFFF` card | 5.18:1 | Small orange text on cards |
| `#B45309` deep amber | `#F8F6F4` background | 4.66:1 | Progress and achievement text |
| `#FFFFFF` white | `#B45309` amber | 5.02:1 | Amber button label |
| `#FFFFFF` white | `#C2410C` deep ember | 5.18:1 | Pressed/active label |

Bright `#FF5722` is reserved for borders, glows, and fills; white text on `#FF5722` is 3.16:1 and must not be used for small labels. The active navigation pill keeps the requested orange fill with white text; if strict 4.5:1 is required for its small label, use `accent-pressed #C2410C` as the fill.

**Rationale**: The light palette is warm but must remain legible. A deep-ember companion preserves the orange identity for text while meeting contrast requirements.

**Alternatives considered**:

- Using bright orange for all text: rejected because it fails contrast on cream.
- Using dark text on orange fills: rejected because the product direction asks for white labels on orange; white is reserved for fills, not small text on light surfaces.
- Amber-only active states: rejected because orange is the primary action/intervention role and provides a stronger active signal.

## R3. Legacy color migration map

**Decision**: Use a consistent mapping from the existing cool palette to the warm roles:

| Legacy usage | New role |
|--------------|----------|
| `bg-slate-950`, `bg-slate-900` | `bg-background` |
| `bg-slate-800`, `bg-slate-800/70`, `bg-slate-900/80` | `bg-card`, `bg-card/70`, `bg-card/80` |
| `border-slate-600`, `border-slate-700`, `border-slate-800` | `border-border-card` |
| `text-slate-50`, `text-slate-100`, `text-slate-200`, `text-slate-300` | `text-text-primary` |
| `text-slate-400`, `text-slate-500`, `text-slate-600` | `text-text-secondary` |
| `text-slate-900` on bright fills | `text-white` |
| `bg-emerald-400`, `bg-emerald-500` | `bg-brand-orange`; pressed `bg-accent-pressed` |
| `text-emerald-300`, `text-emerald-400` on light surfaces | `text-accent-strong` for actions or `text-brand-amber` for pause/achievement |
| `border-emerald-*`, `ring-emerald-*` | `border-brand-orange` or `border-brand-amber` by semantic role |
| `bg-emerald-500/10`, `bg-emerald-400/15` | `bg-brand-orange/10` or `bg-brand-amber/10` |
| `text-rose-*`, `bg-rose-*` alerts | `text-accent-strong`, `bg-brand-orange` |
| Resist/positive states using emerald | `brand-amber` |
| Relapse/alert states using amber or rose | `accent-strong` / `brand-orange` |
| `text-red-400` error copy | `text-accent-strong` |
| Hardcoded `#10b981` in spinners/icons/shadows | `THEME_COLORS.brandOrange`/`brandAmber` |

**Rationale**: A mechanical mapping prevents a mixed visual language and gives each screen a predictable result. Semantic exceptions preserve meaning: amber celebrates progress, orange signals action or attention.

**Alternatives considered**:

- Screen-by-screen ad hoc choices: rejected because it causes inconsistency.
- Keeping red for errors: rejected because the spec assigns alerts to the orange role; orange also passes contrast on the background.

## R4. Navigation active state and narrow-width behavior

**Decision**: Replace the scrollable header with a fixed top tab bar containing five equal-width items: Inicio, Historial, Inventario, Logros, Equipo. The bar uses a `flex-row` with each tab at `flex-1`, compact vertical icon+label anatomy, and no horizontal ScrollView. The active tab uses `brand-orange` with white text/icon; inactive tabs use `text-secondary` on a transparent/card surface. Pressing a tab uses `router.replace` so the main view changes immediately without a back stack. `Equipo` opens `/team`.

**Rationale**: The row already exists and supports horizontal overflow. Retaining it avoids reworking navigation structure and satisfies the narrow-width requirement without wrapping labels into multiple lines.

**Alternatives considered**:

- Five equal-width fixed pills: rejected because labels such as "Inventario" and "Historial" would become cramped on small devices.
- A bottom tab bar: rejected as a larger navigation change outside the feature scope.
- Icon-only pills: rejected because labels improve discoverability and accessibility.

## R5. Runtime icon and shadow colors

**Decision**: Add `src/shared/constants/theme.ts` exporting a typed `THEME_COLORS` object with the primary light values plus `accentStrong`, `accentPressed`, and `white`. Views use it for `ActivityIndicator`, lucide icon `color` props, and glow shadow colors. Tailwind classes remain the primary styling mechanism.

**Rationale**: NativeWind cannot pass colors to third-party icon props or React Native shadow styles through `className`. A central constant avoids scattering raw hex strings across components.

**Alternatives considered**:

- Hardcode hex values at each icon: rejected because it creates drift.
- Force all icons to inherit `currentColor`: lucide-react-native does not reliably inherit NativeWind text color in this setup.
- Generate a TS module from Tailwind config: rejected as unnecessary build tooling for a small palette.

**Sync rule**: `tailwind.config.js`, `src/shared/constants/theme.ts`, and `system-design.md` must be updated together when a token changes.

## R6. Design reference structure

**Decision**: Create `system-design.md` at the repository root with sections for:

1. Brand intent and personality.
2. Color tokens and usage table.
3. Surface ordering and elevation.
4. Borders, radii, and shadows.
5. Typography and tracking.
6. Navigation pills and active/inactive/pressed states.
7. Primary and intervention actions.
8. Status roles: pause/progress/achievement vs alert.
9. Accessibility and contrast rules.
10. Migration map and future-token governance.

**Rationale**: A root-level document sits beside `constitution.md` and `code-rules.md`, making it easy to find and establishing it as part of project governance rather than a feature-local note.

**Alternatives considered**:

- Put the document inside `specs/012-tabaco-fuego-theme/`: rejected because it would be buried with a single feature and harder to discover later.
- Rely only on Tailwind config comments: rejected because token names alone do not explain composition, hierarchy, or usage.

## R7. Validation and audit strategy

**Decision**: Validate in four layers:

1. **Static audit**: `rg` for legacy classes and hardcoded cool-palette hex values (`slate-`, `emerald-`, `blue-`, `cyan-`, `teal-`, `green-`, `#10b981`, `#0f172a`, etc.).
2. **Type and lint**: `npx tsc --noEmit` and `npm run lint`.
3. **Behavior**: `npm test` to confirm no regression in calculations, hooks, or data behavior.
4. **Bundle and visual**: `npx expo export --platform android --clear` to confirm Metro resolution, followed by a manual screen-by-screen visual and navigation check.

**Rationale**: The feature is visual but touches many files; static audit catches missed screens, and the Android export catches bundling issues such as the previous lucide `.mjs` resolution problem.

**Alternatives considered**:

- Rely only on TypeScript and tests: rejected because unused color classes do not fail type checking.
- Snapshot tests for every screen: rejected as brittle and unnecessary for a visual token migration; manual visual validation plus static audit is more practical.

## R8. Data and behavior boundary

**Decision**: No changes to `src/db/`, `drizzle/`, module hooks, metric helpers, schemas, or route destinations. Edits are limited to `tailwind.config.js`, `system-design.md`, `src/shared/constants/theme.ts`, view files, and the root layout's loading/error surfaces.

**Rationale**: The specification explicitly forbids changing SQLite queries and Drizzle hooks. Keeping the boundary narrow also makes the change reviewable and low-risk.

**Alternatives considered**:

- Refactor shared card/button components while restyling: rejected because it expands scope and risk beyond the visual theme.
- Introduce a design-system component library: rejected as premature for this iteration.

## Resolved Unknowns

All Technical Context fields are resolved. No `NEEDS CLARIFICATION` markers remain.
