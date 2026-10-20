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

- **R-SESSION-1**: Show a live ascending timer based on wall-clock time rebuilt from the persisted `active_smoking_session.startedAtMs`; do not block the UI thread.
- **R-SESSION-2**: Schedule up to twelve local notifications at 300-second boundaries with title "¿Terminaste?"; the in-app prompt is a foreground reinforcement only.
- **R-SESSION-3**: "Terminé" records one session with exact seconds, decrements inventory one when available, clears the active row, cancels session notifications, and updates today's count on Home.
- **R-SESSION-4**: Empty inventory → record session, keep stock 0, show a notice.
- **R-SESSION-5**: Leaving the screen before finish writes no event, clears the active row, and cancels pending session notifications.
- **R-SESSION-6**: Rapid duplicate finish taps create one session.
- **R-SESSION-7**: On success, replace to `/` with a positive confirmation.
- **R-SESSION-8**: Tapping a session notification opens `/smoking-session` with the persisted session id and trigger.
- **R-SESSION-9**: At 30+ minutes elapsed, offer "Sí, terminé" and "Descartar sesión"; discarding records nothing.
- **R-SESSION-10**: Session notifications use the `smoking-session` Android channel and the `smoking-session:` identifier prefix.

## Idle reminder isolation

- **R-IDLE-SESSION-1**: Idle reminders MUST be suspended while `active_smoking_session` has a row.
- **R-IDLE-SESSION-2**: Both notification families MUST cancel only their own identifiers; `cancelAllScheduledNotificationsAsync()` is forbidden.

## Team stub contract

- **R-TEAM-1**: `/team` shows "El Guardián", "El Inquebrantable", and "El Resiliente".
- **R-TEAM-2**: With no team data, a clear empty state is shown.
- **R-TEAM-3**: No network or synchronization is attempted.

## Deep-linking

- Scheme `pausa://`; `/pause`, `/smoking-session`, and `/team` remain reachable and obey the profile guard.
- Local session notifications deep-link to `/smoking-session?sessionId=<id>&trigger=<emotion>`; cold starts are handled through `getLastNotificationResponseAsync()`.
