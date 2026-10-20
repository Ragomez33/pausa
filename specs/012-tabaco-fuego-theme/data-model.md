# Data Model: Tabaco & Fuego Light Theme

**Feature**: `012-tabaco-fuego-theme`
**Date**: 2026-10-19

This feature introduces no database entities and no migrations. The "model" below describes design tokens, visual surfaces, navigation items, and component states that the implementation must keep consistent.

## Entity: Design Token

A named visual role with a fixed value and an allowed usage.

| Field | Type | Rules |
|-------|------|-------|
| `name` | text | Kebab-case semantic role; unique across the palette |
| `value` | hex color | Uppercase 6-digit hex; must match `system-design.md` and runtime constants |
| `role` | enum | `surface`, `border`, `text`, `action`, `status`, `support` |
| `usage` | text | Short guidance describing where the token may appear |
| `contrastPair` | text[] | Foreground/background combinations that have been validated |

### Primary Tokens

| Token | Value | Role | Usage |
|-------|-------|------|-------|
| `background` | `#F8F6F4` | Surface | Page and root background, loading/error screens |
| `card` | `#FFFFFF` | Surface | Cards, pills, forms, elevated panels |
| `border-card` | `#E5E0DA` | Border | Card outlines, input borders, dividers |
| `text-primary` | `#1A1412` | Text | Headings and primary copy on light surfaces |
| `text-secondary` | `#6E655F` | Text | Labels, helper copy, inactive navigation text |
| `brand-orange` | `#FF5722` | Action/Status | Primary action fills, active pills, intervention border/glow |
| `accent` | `#FF5722` | Action | Alias of `brand-orange` for active navigation and emphasis |
| `accent-strong` | `#C2410C` | Action | Small orange text on light surfaces; pressed orange actions |
| `brand-amber` | `#B45309` | Status | Pause, progress, achievements, amber text states |

### Companion Tokens

| Token | Value | Role | Usage |
|-------|-------|------|-------|
| `accent-pressed` | `#C2410C` | Action | Pressed state for orange actions |
| `white` | `#FFFFFF` | Text | Text and icons placed on orange or amber fills |

### Validation Rules

- **VT-001**: Every primary token value must match the specification exactly.
- **VT-002**: White `#FFFFFF` must be used as text on `brand-orange` and `brand-amber`; small orange text on light surfaces must use `accent-strong`.
- **VT-003**: `brand-orange`, `accent-strong`, and `brand-amber` are not interchangeable: orange signals action/attention, accent-strong provides accessible orange text, amber signals pause/progress/achievement.
- **VT-004**: Any new token must be added to `tailwind.config.js`, `src/shared/constants/theme.ts`, and `system-design.md` in the same change.
- **VT-005**: Text/background pairs must meet at least 4.5:1 for normal text.

## Entity: Theme Surface

A layered visual region composed of background, card, border, and text roles.

| Field | Type | Rules |
|-------|------|-------|
| `level` | enum | `page`, `card`, `inset`, `overlay` |
| `backgroundToken` | token name | `background` for page; `card` for card/inset; opacity variants allowed |
| `borderToken` | token name | `border-card` by default |
| `primaryTextToken` | token name | `text-primary` on light surfaces; `white` on orange/amber fills |
| `secondaryTextToken` | token name | `text-secondary` on light surfaces |
| `radius` | enum | `sm`, `md`, `lg`, `xl`, `2xl`, `3xl`, `full` per existing hierarchy |
| `shadow` | enum | `none`, `card`, `ember`; ember only for primary/intervention emphasis |

### Surface Ordering

1. **Page**: `background`, no border, no shadow.
2. **Card**: `card` with `border-card`; subtle elevated shadow allowed.
3. **Inset**: `background` or `card` with opacity, used inside cards for codes, metrics, or nested rows.
4. **Overlay**: `card` with stronger border/shadow, used for banners and modals.
5. **Ember emphasis**: `card` or `background` with a `brand-orange` border and an ember shadow, reserved for the intervention action and critical attention.

## Entity: Navigation Item

A destination in the home header.

| Field | Type | Rules |
|-------|------|-------|
| `key` | enum | `home`, `history`, `inventory`, `badges`, `team` |
| `label` | text | `Inicio`, `Historial`, `Inventario`, `Logros`, `Equipo` |
| `route` | route | `/`, `/history`, `/inventory`, `/badges`, `/team` |
| `icon` | icon | Centralized lucide icon from `src/shared/components/icons.ts` |
| `state` | enum | `active`, `inactive`, `pressed` |

### State Transitions

| From | Trigger | To | Visual Contract |
|------|---------|----|-----------------|
| `inactive` | Current route matches item | `active` | `bg-brand-orange`, `text-white`, white icon |
| `active` | Route changes away | `inactive` | `bg-card`, `border-border-card`, `text-text-secondary` |
| `inactive` | Press start | `pressed` | `bg-border-card` or `bg-card/70`, visible feedback |
| `pressed` | Press end | `inactive` or route navigation | Restore styling or activate destination |
| Any | Tap `Equipo` | `/team` | `router.push('/team')` |

## Entity: Intervention Action

The "Quiero fumar" home action.

| Field | Type | Rules |
|-------|------|-------|
| `label` | text | `Quiero fumar` |
| `supportingCopy` | text | Short intervention reminder; existing copy preserved unless needed |
| `backgroundToken` | token | `card` with `brand-orange` border and a subtle orange wash |
| `borderToken` | token | `brand-orange` at full or high opacity |
| `textToken` | token | `text-primary` on the light wash; `white` on orange fills |
| `iconToken` | token | `white` on orange fill |
| `pressedState` | state | `border-card` outer surface or `accent-pressed` icon fill |
| `action` | route | Opens the existing `/pause` intervention |

### Validation Rules

- **VA-001**: The intervention action must remain the most visually prominent control on home.
- **VA-002**: The action must use `brand-orange` on its background or border.
- **VA-003**: Pressed feedback must remain visible and preserve readable text.
- **VA-004**: The action must not change the target route or pause behavior.

## Entity: Design Reference

The root `system-design.md` document.

| Field | Type | Rules |
|-------|------|-------|
| `palette` | token table | All primary and companion tokens with values and roles |
| `ordering` | ordered list | Surface hierarchy from page to ember emphasis |
| `borders` | guidance | Border token, opacity, and radius conventions |
| `backgrounds` | guidance | When to use background, card, inset, and overlay |
| `typography` | guidance | Primary/secondary copy, uppercase labels, tracking, weights |
| `navigation` | guidance | Pill anatomy, active/inactive/pressed, narrow-width behavior |
| `actions` | guidance | Primary, intervention, secondary, disabled, pressed |
| `status` | guidance | Alert orange vs pause/achievement amber |
| `accessibility` | guidance | Contrast pairs, color-plus-shape rule, touch targets |
| `governance` | guidance | Token change and sync rule |

## Non-Entities

- No SQLite tables, columns, indexes, or migrations.
- No Drizzle schemas, queries, or mappers.
- No new hooks, stores, or cache entries.
- No new runtime dependencies.
