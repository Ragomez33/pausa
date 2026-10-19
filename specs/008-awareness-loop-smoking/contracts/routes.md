# Contract: Routes & Core Flows

Thin-router contract (constitution §1.2, code-rules §9). Routes import module views only.

## Route map

| Path | Route file | Renders |
|------|-----------|---------|
| `/` | `app/index.tsx` | `DashboardScreen` |
| `/pause` | `app/pause/index.tsx` | `AwarenessLoopScreen` (replaces the old breathing PauseScreen) |
| `/smoking-session` | `app/smoking-session/index.tsx` | `SmokingSessionScreen` |
| `/team` | `app/team/index.tsx` | `TeamScreen` ranking stub |
| `/badges`, `/history`, `/inventory`, `/onboarding` | unchanged | unchanged |

The root `Stack` MUST register `smoking-session`.

## Home contract

- **R-HOME-1**: Primary action label MUST be "Quiero fumar" / "Tengo ganas de fumar" and navigate to `/pause`.
- **R-HOME-2**: Home MUST show today's smoked count vs. the daily limit.
- **R-HOME-3**: Home MUST remain usable while reminders are denied or unavailable.
- **R-HOME-4**: Home focus MAY schedule/replace reminders without blocking rendering.

## Awareness loop contract

- **R-LOOP-1**: Step 1 asks "¿Puedes posponerlo?" with Sí/No.
- **R-LOOP-2**: Sí → increment postponed count once, show positive feedback, replace to `/`, no session.
- **R-LOOP-3**: No → show exactly four emotions: Ansiedad/Estrés, Aburrimiento, Costumbre, Presión Social.
- **R-LOOP-4**: Selecting an emotion shows a bank message and "Iniciar Cigarrillo".
- **R-LOOP-5**: "Iniciar Cigarrillo" navigates to `/smoking-session` with the selected trigger.
- **R-LOOP-6**: Leaving before a confirmed postpone or session start persists nothing.
- **R-LOOP-7**: Repeated postpone taps increment at most once.
- **R-LOOP-8**: UI uses NativeWind/native primitives only.

## Smoking session contract

- **R-SESSION-1**: Show a live ascending timer based on wall-clock time; do not block the UI thread.
- **R-SESSION-2**: Every 300 seconds show "¿Terminaste?" with "Seguir" and "Terminé"; "Seguir" hides it until the next boundary.
- **R-SESSION-3**: "Terminé" records one session with exact seconds, decrements inventory one when available, and updates today's count on Home.
- **R-SESSION-4**: Empty inventory → record session, keep stock 0, show a notice.
- **R-SESSION-5**: Leaving before finish writes nothing.
- **R-SESSION-6**: Rapid duplicate finish taps create one session.
- **R-SESSION-7**: On success, replace to `/` with a positive confirmation.

## Team stub contract

- **R-TEAM-1**: `/team` shows "El Guardián", "El Inquebrantable", and "El Resiliente".
- **R-TEAM-2**: With no team data, a clear empty state is shown.
- **R-TEAM-3**: No network or synchronization is attempted.

## Deep-linking

- Scheme `pausa://`; `/pause`, `/smoking-session`, and `/team` remain reachable and obey the profile guard.
