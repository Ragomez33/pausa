# Pausa — System Design: Tabaco & Fuego (Light)

**Version**: 2.1.0
**Last updated**: 2026-10-19
**Scope**: Visual language for the Pausa mobile app

This document is the canonical visual reference for Pausa. It records the palette, token roles, surface ordering, border and radius conventions, typography, navigation states, action states, and governance rules. Update it in the same change as any visual-token modification.

---

## 1. Brand Intent

Pausa should feel warm, fresh, and human: a soft cream page, white cards, ember orange for action, and deep tobacco brown for text. The interface should invite a calm pause instead of feeling clinical, smoky, or punitive.

**Personality**

- Warm and grounded
- Fresh and legible
- Direct and adult
- Urgent without being punishing
- Local, tactile, and human

**Avoid**

- Dark navy/teal dashboards
- Mint-green wellness clichés
- Low-contrast amber text on cream
- Pure black surfaces or heavy dark overlays
- Neon colors outside the orange/amber family

---

## 2. Color Tokens

### Primary Palette

| Token | Value | Role | Usage |
|-------|-------|------|-------|
| `background` | `#F8F6F4` | Page surface | App background, page roots, loading/error screens |
| `card` | `#FFFFFF` | Card surface | Cards, forms, pills, panels, modals |
| `border-card` | `#E5E0DA` | Border | Card borders, input borders, separators |
| `text-primary` | `#1A1412` | Primary text | Headings, metric values, primary copy |
| `text-secondary` | `#6E655F` | Secondary text | Labels, helper copy, inactive navigation |
| `brand-orange` | `#FF5722` | Action/alert | Primary actions, intervention, attention states |
| `accent` | `#FF5722` | Active emphasis | Active navigation and selected states |
| `brand-amber` | `#B45309` | Pause/progress | Pause states, achievements, progress text |

### Companion Tokens

| Token | Value | Role | Usage |
|-------|-------|------|-------|
| `accent-strong` | `#C2410C` | Deep ember | Orange text on light surfaces; accessible action labels |
| `accent-pressed` | `#C2410C` | Pressed action | Pressed state for orange actions |
| `white` | `#FFFFFF` | Text on fills | Text/icons on orange or amber fills |

### Semantic Rules

- **Orange = action or attention.** Use `brand-orange` for the intervention border/glow and `accent-strong` for small orange text on light surfaces.
- **Amber = pause, progress, achievement.** Use `brand-amber` for streaks, progress bars, unlocked badges, resisted outcomes, and reflection cards.
- **Dark brown = primary copy.** Use `text-primary` on cream and white surfaces.
- **Ash brown = secondary copy.** Use `text-secondary` for labels, helper text, inactive pills, and metadata.
- **White = text on bright/dark accent fills.** Use it on `brand-orange` and `brand-amber` buttons, chips, and active pills.

### Tailwind / NativeWind Class Examples

```text
Page:              bg-background
Card:              bg-card
Border:            border-border-card
Primary copy:      text-text-primary
Secondary copy:    text-text-secondary
Orange action:     bg-brand-orange text-white
Amber progress:    bg-brand-amber text-white
Active nav:        bg-brand-orange text-white
Pressed action:    active:bg-accent-pressed
Orange text:       text-accent-strong
Subtle orange:     bg-brand-orange/10 border-brand-orange/30
Subtle amber:      bg-brand-amber/10 border-brand-amber/30
```

---

## 3. Surface Ordering

Use the following hierarchy from back to front:

1. **Page** — `background`, no border, no shadow.
2. **Card** — `card` with `border-card` and a soft shadow (`shadow-sm` equivalent).
3. **Inset** — `background` inside a card, used for codes, timers, and nested metrics.
4. **Overlay** — `card` with a stronger border and shadow, used for dialogs and banners.
5. **Ember emphasis** — `card` or `background` with a `brand-orange` border and an orange glow, reserved for the intervention action and critical attention.

Do not stack more than three surface levels without a clear content reason.

---

## 4. Borders, Radii, and Shadows

### Borders

- Default border: `border-border-card` (`#E5E0DA`).
- Action border: `border-brand-orange`.
- Progress border: `border-brand-amber`.
- Subtle washes: opacity between `/10` and `/40`.
- Avoid heavy black borders or pure gray dividers.

### Radii

| Element | Radius |
|---------|--------|
| Pills, chips | `rounded-full` |
| Inputs and small buttons | `rounded-xl` |
| Cards and metric tiles | `rounded-2xl` |
| Hero cards and large panels | `rounded-3xl` |
| Intervention action | `rounded-[30px]` with an inner `rounded-[22px]` layer |

### Shadows

- **Card shadow**: soft, dark-brown shadow at low opacity (`shadow-sm` feel).
- **Amber glow**: streak/progress surfaces only.
- **Orange glow**: intervention action and critical attention only.
- Use the `style` prop only for native shadow values that NativeWind cannot express; add a code comment explaining the exception.
- Never use a heavy glow on every card. Glow is a hierarchy signal, not decoration.

---

## 5. Typography

| Role | Style |
|------|-------|
| Page title | `text-3xl` or `text-4xl`, `font-black`, tight tracking |
| Section title | `text-2xl`, `font-black` or `font-bold` |
| Card value | `text-2xl` to `text-4xl`, `font-black` |
| Body | `text-sm` or `text-base`, `font-medium` or `font-normal` |
| Labels | `text-[10px]` to `text-xs`, uppercase, bold, wide tracking |
| Helper text | `text-xs` or `text-[11px]`, secondary color |

Use dark brown for primary copy, ash brown for secondary copy, and white on orange/amber fills.

---

## 6. Persistent Top Tab Bar

### Structure

Inicio · Historial · Inventario · Logros · Equipo

### Anatomy

- Fixed at the top of every main view: `/`, `/history`, `/inventory`, `/badges`, `/team`
- Five equal-width tabs in a `flex-row` container
- Container: `bg-card`, `border-border-card`, rounded corners, compact padding
- Each tab: icon above a short one-line label, minimum 44-point touch height
- No horizontal ScrollView; all five tabs must fit on screen
- Team create/join/detail sub-screens keep their own back header

### States

| State | Background | Text | Icon |
|-------|------------|------|------|
| Active | `brand-orange` | `white` | `white` |
| Inactive | transparent / `card` | `text-secondary` | `text-secondary` |
| Pressed inactive | `border-card` | `text-secondary` | `text-secondary` |
| Pressed active | `accent-pressed` | `white` | `white` |

Active state must remain distinguishable by fill and weight, not just hue. Tapping a tab navigates to the existing tab screen without remounting the whole hierarchy; tapping Equipo opens `/team`. The current tab must not trigger redundant navigation. Main views must not show a redundant "Volver" button. Main routes live in an Expo Router `Tabs` group with `lazy: false`; root and scene backgrounds use `background` so transitions never expose a blank white/black frame.

---

## 7. Actions

### Primary Action

- Background: `brand-orange`
- Text/icon: `white`
- Pressed: `accent-pressed`
- Disabled: `border-card` with `text-secondary`
- Examples: create team, save purchase, continue onboarding

### Intervention Action ("Quiero fumar")

- Shape: large `rounded-full` circle centered in the available home space
- Background: `brand-orange`
- Content: cigarette icon in white plus white `font-bold` "Quiero fumar" text
- No interior subtitle or explanatory filler
- Glow: orange, reserved for this action
- Pressed: `accent-pressed` while keeping the white label readable
- Must remain the most visually prominent home action
- Home above the circle shows only current streak and today's resisted/ceded summary; financial and consumption details live in History/Statistics

### Secondary Action

- Background: `card` or `background`
- Border: `border-card`
- Text: `text-secondary`
- Pressed: `border-card` or `card/70`
- Examples: cancel, "Mejor no fumo", "Seguir fumando"

### Destructive or Alert

- Use `accent-strong` text and `brand-orange` surfaces rather than red.
- Reserve stronger treatment for irreversible actions only; the app currently has none.

---

## 8. Status Roles

| Meaning | Role | Example |
|---------|------|---------|
| Pause / breathing | `brand-amber` | Pause timer, reflection card |
| Progress / streak | `brand-amber` | Streak hero, progress bars |
| Achievement | `brand-amber` | Unlocked badges, leaderboard distinctions |
| Primary action | `brand-orange` | Create, save, continue |
| Attention / relapse | `accent-strong` / `brand-orange` | Ceded outcomes, intervention, errors |
| Neutral metadata | `text-secondary` | Dates, helper copy, inactive pills |

Do not use amber for destructive or error states, and do not use orange text on cream when a deeper ember is required for readability.

---

## 9. Accessibility and Contrast

Validated pairs:

| Foreground | Background | Ratio |
|------------|------------|-------|
| `#1A1412` | `#F8F6F4` | 16.90:1 |
| `#6E655F` | `#F8F6F4` | 5.28:1 |
| `#1A1412` | `#FFFFFF` | 18.22:1 |
| `#6E655F` | `#FFFFFF` | 5.69:1 |
| `#C2410C` | `#F8F6F4` | 4.80:1 |
| `#C2410C` | `#FFFFFF` | 5.18:1 |
| `#B45309` | `#F8F6F4` | 4.66:1 |
| `#B45309` | `#FFFFFF` | 5.02:1 |
| `#FFFFFF` | `#B45309` | 5.02:1 |
| `#FFFFFF` | `#C2410C` | 5.18:1 |

Rules:

- Use `accent-strong` for small orange text on light surfaces; `brand-orange` alone is intended for borders, glows, and fills.
- Use `brand-amber` (`#B45309`) for amber text; the brighter amber is not legible on cream.
- Active navigation uses white on `brand-orange` per the product direction; if strict 4.5:1 is required for small labels, switch the active fill to `accent-pressed`.
- Keep touch targets at least 44 points.
- Test with system text scaling and the narrowest supported width.

---

## 10. Legacy Migration Map

| Legacy | Tabaco & Fuego Light |
|--------|----------------------|
| `bg-slate-950`, `bg-slate-900` | `bg-background` |
| `bg-slate-800`, `bg-slate-800/70` | `bg-card`, `bg-card/70` |
| `border-slate-600/700/800` | `border-border-card` |
| `text-slate-50/100/200/300` | `text-text-primary` |
| `text-slate-400/500/600` | `text-text-secondary` |
| `text-slate-900` on bright fills | `text-white` |
| `bg-emerald-400/500` | `bg-brand-orange`; pressed `bg-accent-pressed` |
| `text-emerald-*` on actions | `text-accent-strong` |
| `text-emerald-*` on progress/achievements | `text-brand-amber` |
| `border-emerald-*` | `border-brand-orange` or `border-brand-amber` by role |
| `bg-emerald-500/10` washes | `bg-brand-orange/10` or `bg-brand-amber/10` |
| `rose-*` and `red-*` alerts | `text-accent-strong` / `brand-orange` |
| `amber-*` positive states | `brand-amber` |
| Hardcoded `#10b981` | `THEME_COLORS.brandOrange`/`brandAmber` |

---

## 11. Token Governance

- Source files:
  - `tailwind.config.js` — NativeWind utility colors.
  - `src/shared/constants/theme.ts` — runtime values for icons, spinners, and shadows.
  - `system-design.md` — this document.
- A token change MUST update all three sources in the same change.
- Components MUST NOT introduce raw hex values when a semantic token exists.
- New tokens require a documented role and contrast check.
- Keep the semantic distinction between `brand-orange`, `accent-strong`, and `brand-amber`.
- Do not add a component library or theme provider for a static palette; use NativeWind plus the shared constants.
- When a future screen is designed, start from this document before adding new visual patterns.

---

## 12. Quick Reference

```text
Background   #F8F6F4
Card         #FFFFFF
Border       #E5E0DA
Primary text #1A1412
Secondary    #6E655F
Orange       #FF5722
Orange text  #C2410C
Orange press #C2410C
Amber        #B45309
White        #FFFFFF
```
