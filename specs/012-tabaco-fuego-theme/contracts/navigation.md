# Contract: Persistent Top Tab Bar

**Feature**: `012-tabaco-fuego-theme`
**Scope**: Main navigation across `/`, `/history`, `/inventory`, `/badges`, and `/team`

## Destinations

| Key | Label | Route | Icon |
|-----|-------|-------|------|
| `home` | Inicio | `/` | House |
| `history` | Historial | `/history` | Clock |
| `inventory` | Inventario | `/inventory` | Package |
| `badges` | Logros | `/badges` | Trophy |
| `team` | Equipo | `/team` | Users |

- **NV-001**: The bar MUST contain exactly these five destinations in this order.
- **NV-002**: The bar MUST be fixed at the top of every main view and MUST NOT scroll horizontally.
- **NV-003**: Tapping a tab MUST replace the current main view immediately using the router replacement action.
- **NV-004**: Tapping the already-active tab MUST NOT trigger redundant navigation.
- **NV-005**: The route destinations MUST remain unchanged from the current app.
- **NV-006**: Main views MUST NOT show a redundant "Volver" button; team create/join/detail sub-screens retain their own back header.

## Visual States

### Active

- Background: `brand-orange`
- Label: `white`
- Icon: `white`
- The active state MUST also be distinguishable by fill and weight, not color alone.

### Inactive

- Background: transparent or `card`
- Label: `text-secondary`
- Icon: `text-secondary`
- Press feedback: `border-card` or a subtle opacity change.

### Pressed

- Inactive tab: background moves toward `border-card` or opacity drops.
- Active tab: background moves toward `accent-pressed`.
- Pressed feedback MUST NOT make the label unreadable.

## Layout Contract

- **NV-007**: The bar uses a horizontal `flex-row` with five `flex-1` tabs and compact gaps.
- **NV-008**: Each tab shows an icon above a short one-line label; labels MUST NOT wrap.
- **NV-009**: The bar container uses `border-border-card`, `bg-card`, rounded corners, and compact internal padding.
- **NV-010**: All five tabs MUST fit fully within the screen width, including Equipo, with no horizontal ScrollView.
- **NV-011**: Tabs MUST have a minimum touch target of 44 points in height.
- **NV-012**: The bar MUST preserve the existing icon bridge in `src/shared/components/icons.ts`.

## Accessibility Contract

- **NV-013**: Active and inactive states must remain distinguishable for people with reduced color perception.
- **NV-014**: Icons are decorative; labels carry the destination name.
- **NV-015**: Active labels/icons use white on `brand-orange`; inactive labels/icons use `text-secondary` on `card`.
- **NV-016**: Each tab exposes `accessibilityRole="tab"` and its selected state.
