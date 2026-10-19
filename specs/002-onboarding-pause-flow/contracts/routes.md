# Contract: Routes & Navigation (Module 1)

Thin-router contract (constitution §1.2, code-rules §9). Route files only import and render module
views; no business logic or DB access directly in `app/`.

## Route map

| Path | Route file | Renders | Module |
|------|-----------|---------|--------|
| `/` | `app/index.tsx` | `DashboardScreen` (guards on profile) | `src/modules/dashboard` |
| `/onboarding` | `app/onboarding/index.tsx` | `OnboardingScreen` | `src/modules/onboarding` |
| `/pause` | `app/pause/index.tsx` | `PauseScreen` | `src/modules/pause` |

## Navigation behavior

- **R-NAV-1**: On mount, the home view MUST check for a profile. If none exists, it MUST redirect to
  `/onboarding` (replace, no back to home).
- **R-NAV-2**: After a successful onboarding save, the app MUST `replace` to `/` (home).
- **R-NAV-3**: Tapping the central Pausa button on home MUST navigate to `/pause`.
- **R-NAV-4**: Leaving `/pause` before saving MUST persist nothing.
- **R-NAV-5**: Routes MUST NOT duplicate screen logic; they import `src/modules/<module>/views/*`.

## Deep-linking scheme

- Scheme `pausa://` (from the scaffold). `/pause` is reachable as `pausa://pause`.
