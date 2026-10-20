# Contract: Routes & Interaction Flow

Thin-router contract (constitution §1.2, code-rules §9). Route files continue to import module views only.

## Route map

| Path | Route file | Renders |
|------|-----------|---------|
| `/` | `app/index.tsx` | `DashboardScreen` |
| `/pause` | `app/pause/index.tsx` | `PauseScreen` |
| `/onboarding` | `app/onboarding/index.tsx` | `OnboardingScreen` |

## Home contract

- **R-HOME-1**: Home MUST show only the current streak and a compact today summary of resisted/ceded counts.
- **R-HOME-2**: Home MUST show a large brand-orange circular Pausa action centered in the available space, with a cigarette icon and white bold "Quiero fumar" text, navigating to `/pause`.
- **R-HOME-3**: Home MUST refresh streak and today-summary values on focus and at least once per minute while visible.
- **R-HOME-4**: Home MUST show updated values immediately after returning from a saved intervention.
- **R-HOME-5**: Home MUST NOT show avoided cigarettes, money saved, inventory spending, or pack-count cards; those metrics MUST be available in History/Statistics.
- **R-HOME-6**: Home MUST accept an optional `feedback` parameter (`resisted` or `ceded`) and show a reinforcing inline banner.
- **R-HOME-7**: The banner MUST be dismissible and MUST NOT block the Pausa action.
- **R-HOME-8**: If no profile exists, home MUST redirect to `/onboarding` (existing behavior).
- **R-HOME-9**: Home MUST NOT contain the removed filler phrases listed in the spec.
- **R-HOME-10**: Home MUST show header navigation pills for Inicio, Historial, Inventario, Logros, and Equipo, with a clearly distinguishable active state.
- **R-HOME-11**: Tapping Equipo MUST navigate to `/team` using the router.
- **R-HOME-12**: The Pausa call-to-action MUST be a large circular brand-orange button centered in the available space.
- **R-HOME-13**: The two home summary cards MUST use white surfaces, defined borders, soft shadows, and readable typography.
- **R-HOME-14**: The main navigation MUST be a fixed top tab bar with five equal-width tabs that fit without horizontal scrolling and keep Equipo fully visible.

## Pause intervention contract

- **R-PAUSE-1**: The countdown MUST last 10–15 seconds (default 12) and MUST be visible.
- **R-PAUSE-2**: Outcome actions MUST be disabled while the countdown is running.
- **R-PAUSE-3**: Leaving before saving MUST persist nothing and clear local form state.
- **R-PAUSE-4**: After the countdown, the screen MUST show the five trigger options, an optional notes input, and both outcome actions.
- **R-PAUSE-5**: Saving without a trigger MUST be blocked with a toast.
- **R-PAUSE-6**: "Logré Pausar" MUST save `resisted = 1`; "Cedí / Fumé" MUST save `resisted = 0`.
- **R-PAUSE-7**: On success, the screen MUST replace to `/` with `feedback=resisted` or `feedback=ceded`.
- **R-PAUSE-8**: On failure, the screen MUST stay open, show an error toast, and re-enable retry.
- **R-PAUSE-9**: A repeated tap MUST NOT create a second event.
- **R-PAUSE-10**: The breathing visual MUST use React Native primitives and MUST stop when the countdown ends or the screen unmounts.

## Deep-linking

- Scheme `pausa://` from the scaffold. `/pause` is reachable as `pausa://pause`; direct entry still obeys the countdown gate and profile guard.
