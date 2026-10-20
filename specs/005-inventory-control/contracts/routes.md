# Contract: Routes & Interaction Flow

Thin-router contract (constitution §1.2, code-rules §9). Route files import module views only.

## Route map

| Path | Route file | Renders |
|------|-----------|---------|
| `/` | `app/index.tsx` | `DashboardScreen` |
| `/inventory` | `app/inventory/index.tsx` | `InventoryScreen` |
| `/pause` | `app/pause/index.tsx` | `PauseScreen` |
| `/onboarding` | `app/onboarding/index.tsx` | `OnboardingScreen` |

The root `Stack` in `app/_layout.tsx` MUST register the `inventory` screen.

## Home contract

- **R-HOME-1**: Home MUST provide a visible action navigating to `/inventory`.
- **R-HOME-2**: Home MUST show `inventorySpending` alongside existing savings information.
- **R-HOME-3**: Home MUST refresh inventory spending on focus (existing home refresh behavior).
- **R-HOME-4**: If no profile exists, home MUST redirect to `/onboarding` (existing behavior).

## Inventory screen contract

- **R-INV-1**: The screen MUST show current cigarettes, full packs, estimated days remaining, and the conscious-reflection state.
- **R-INV-2**: When `lowStock` is true, a supportive financial reflection MUST be visible; a low-inventory alert MUST NOT be shown.
- **R-INV-3**: The screen MUST use high-contrast cards, neon-accented borders, and icon-led quick actions without changing any inventory behavior.
- **R-INV-3**: The screen MUST provide "Registrar Compra de Cajetilla" and "Registrar Consumo" actions.
- **R-INV-4**: Only one form may be active at a time, represented by a discriminated `mode` (`none` / `purchase` / `consumption`).
- **R-INV-5**: Purchase form: whole pack count (required) and cost (optional). Consumption form: whole cigarette count (required).
- **R-INV-6**: Invalid quantities/costs MUST block saving with a toast and no inline field errors.
- **R-INV-7**: Consumption above stock MUST be blocked with a toast and no insert.
- **R-INV-8**: Successful saves MUST close the form, refresh the summary, and keep the person on `/inventory`.
- **R-INV-9**: Repeated taps MUST store at most one movement.
- **R-INV-10**: Leaving the screen with an open form MUST persist nothing.
- **R-INV-11**: The screen MUST refresh when it gains focus.
- **R-INV-12**: Missing profile MUST redirect to `/onboarding` (global guard already exists).

## Deep-linking

- Scheme `pausa://`; `/inventory` is reachable as `pausa://inventory` and still obeys the profile guard.
