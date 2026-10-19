# Contract: Routes & Screen Behavior

Thin-router contract (constitution §1.2, code-rules §9). Route files import module views only.

## Route map

| Path | Route file | Renders |
|------|-----------|---------|
| `/` | `app/index.tsx` | `DashboardScreen` |
| `/badges` | `app/badges/index.tsx` | `BadgesScreen` |
| `/history` | `app/history/index.tsx` | `HistoryScreen` |
| `/inventory` | `app/inventory/index.tsx` | `InventoryScreen` |
| `/pause` | `app/pause/index.tsx` | `PauseScreen` |

The root `Stack` in `app/_layout.tsx` MUST register the `badges` screen.

## Home contract

- **R-NAV-1**: Home MUST provide a visible "Logros" action navigating to `/badges`.
- **R-NAV-2**: On Home focus, badge evaluation MUST run automatically.
- **R-NAV-3**: New unlocks MUST produce a lightweight confirmation naming the badges.
- **R-NAV-4**: Existing Home metrics/actions MUST remain available.

## Badges screen contract

- **R-BADGE-1**: The screen MUST show every catalog badge exactly once.
- **R-BADGE-2**: Unlocked badges MUST show a distinct accent style and localized unlock date.
- **R-BADGE-3**: Locked badges MUST be muted and show a progress bar plus `progressValue / target unit`.
- **R-BADGE-4**: Evaluation MUST run before final statuses are rendered; newly unlocked badges MUST appear unlocked immediately.
- **R-BADGE-5**: A summary count of unlocked badges SHOULD be shown.
- **R-BADGE-6**: Missing profile MUST redirect to onboarding and MUST not evaluate.
- **R-BADGE-7**: Storage errors MUST show a clear error/toast without clearing existing unlocks.
- **R-BADGE-8**: The UI MUST use NativeWind/native primitives and no heavy graphics dependency.

## Deep-linking

- Scheme `pausa://`; `/badges` is reachable as `pausa://badges` and still obeys the profile guard.
