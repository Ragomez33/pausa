# Contract: Routes & Screen Behavior

Thin-router contract (constitution §1.2, code-rules §9). Route files import module views only.

## Route map

| Path | Route file | Renders |
|------|-----------|---------|
| `/` | `app/index.tsx` | `DashboardScreen` |
| `/history` | `app/history/index.tsx` | `HistoryScreen` |
| `/inventory` | `app/inventory/index.tsx` | `InventoryScreen` |
| `/pause` | `app/pause/index.tsx` | `PauseScreen` |
| `/onboarding` | `app/onboarding/index.tsx` | `OnboardingScreen` |

The root `Stack` in `app/_layout.tsx` MUST register the `history` screen.

## Home contract

- **R-NAV-1**: Home MUST provide a visible "Historial" action navigating to `/history`.
- **R-NAV-2**: Existing inventory and Pausa actions MUST remain available.
- **R-NAV-3**: Missing profile MUST continue to redirect to `/onboarding`.

## History screen contract

- **R-HIST-1**: The screen MUST show a loading state until events and aggregates are ready.
- **R-HIST-2**: Storage failure MUST show a clear error state instead of partial analytics.
- **R-HIST-3**: The stats area MUST show success rate and active streak before the list.
- **R-HIST-4**: The trigger breakdown MUST show only observed triggers with count, percentage, and a proportional bar; no events → empty state.
- **R-HIST-5**: The event list MUST render newest first with date/time, trigger label, outcome status, and optional notes.
- **R-HIST-6**: No events → the list shows a clear empty state; the stats still show the streak from profile creation.
- **R-HIST-7**: The list MUST use virtualization for long histories and stable keys.
- **R-HIST-8**: The screen MUST reload on focus so new pause events appear.
- **R-HIST-9**: Bars MUST be lightweight native views; no heavy chart dependency.
- **R-HIST-10**: Notes that are null/blank MUST be omitted.

## Deep-linking

- Scheme `pausa://`; `/history` is reachable as `pausa://history` and still obeys the profile guard.
