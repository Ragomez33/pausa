# Contract: Theme Tokens (Light Mode)

**Feature**: `012-tabaco-fuego-theme`
**Scope**: Tailwind/NativeWind configuration and runtime color constants

## Token Table

| Token | Value | Allowed usage |
|-------|-------|---------------|
| `background` | `#F8F6F4` | Page roots, loading/error surfaces, inset rows |
| `card` | `#FFFFFF` | Cards, forms, pills, panels, modal surfaces |
| `border-card` | `#E5E0DA` | Card borders, input borders, separators |
| `text-primary` | `#1A1412` | Headings, values, primary copy on light surfaces |
| `text-secondary` | `#6E655F` | Labels, helper copy, inactive navigation text |
| `brand-orange` / `accent` | `#FF5722` | Primary action fills, intervention border/glow, active pills |
| `accent-strong` | `#C2410C` | Small orange text on light surfaces; pressed orange actions |
| `accent-pressed` | `#C2410C` | Pressed orange action state |
| `brand-amber` | `#B45309` | Pause, progress, achievements, amber text |
| `white` | `#FFFFFF` | Text/icons on orange or amber fills |

## Class Contract

```text
Page surface:        bg-background
Card surface:        bg-card
Card/input border:   border-border-card
Primary text:        text-text-primary
Secondary text:      text-text-secondary
Primary action:      bg-brand-orange text-white / active:bg-accent-pressed
Intervention border: border-brand-orange
Orange text:         text-accent-strong
Pause/achievement:   text-brand-amber / border-brand-amber
White on fill:       text-white
```

Opacity variants are allowed for subtle washes, for example `bg-brand-orange/10`, `border-brand-orange/30`, and `bg-card/70`.

## Contrast Contract

- **CT-001**: `text-primary` on `background` must be 16.90:1.
- **CT-002**: `text-secondary` on `background` must be 5.28:1.
- **CT-003**: `text-primary` on `card` must be 18.22:1.
- **CT-004**: `text-secondary` on `card` must be 5.69:1.
- **CT-005**: `accent-strong` on `background` must be 4.80:1.
- **CT-006**: `accent-strong` on `card` must be 5.18:1.
- **CT-007**: `brand-amber` on `background` must be 4.66:1.
- **CT-008**: `brand-amber` on `card` must be 5.02:1.
- **CT-009**: White on `brand-amber` must be 5.02:1.
- **CT-010**: White on `accent-pressed` must be 5.18:1.

## Governance Contract

- **GT-001**: A token change must update `tailwind.config.js`, `src/shared/constants/theme.ts`, and `system-design.md` together.
- **GT-002**: Components MUST NOT introduce raw hex colors when a semantic token exists.
- **GT-003**: Icons and `ActivityIndicator` use `THEME_COLORS` from `src/shared/constants/theme.ts`.
- **GT-004**: Shadows/glows may use `style` only where NativeWind cannot express the effect, with an explanatory comment.
- **GT-005**: `brand-orange`, `accent-strong`, and `brand-amber` MUST retain distinct semantic roles.
- **GT-006**: Small orange text on light surfaces MUST use `accent-strong`, not `brand-orange`.
