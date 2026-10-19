# Contract: Team Routes & Screens

Thin-router contract (constitution §1.2, code-rules §9). Route files import module views only.

## Route map

| Path | Route file | Renders |
|------|-----------|---------|
| `/team` | `app/team/index.tsx` | Squad dashboard or empty state |
| `/team/create` | `app/team/create.tsx` | Create-team form |
| `/team/join` | `app/team/join.tsx` | Join-by-code form |

The root `Stack` already includes the team group; no new Stack entry is required unless the file structure changes.

## Dashboard contract

- **R-DASH-1**: With no active team, show an empty state with "Crear equipo" and "Unirme con código" actions.
- **R-DASH-2**: With an active team, show name, level label, duration/remaining days, invite code, and member count.
- **R-DASH-3**: Show collective postponements, avoided cigarettes, and money saved.
- **R-DASH-4**: Show each member's userName, smoked today, and daily limit (or a clear empty progress state).
- **R-DASH-5**: Show Guardián, Inquebrantable, and Resiliente cards with the winning member or an empty state.
- **R-DASH-6**: Refresh on focus and after create/join.
- **R-DASH-7**: Missing profile → onboarding redirect.

## Create-team contract

- **R-CREATE-1**: Fields: name, duration (preset whole-day options), difficulty (Fácil/Medio/Difícil/Modo Dios).
- **R-CREATE-2**: Show the calculated daily limit preview from the profile before submit.
- **R-CREATE-3**: Validate name 2–40 chars, positive duration, and a valid level; block otherwise with a toast.
- **R-CREATE-4**: On success navigate to `/team`; on failure stay and show a clear error.
- **R-CREATE-5**: Repeated taps create at most one team.

## Join-team contract

- **R-JOIN-1**: Fields: invite code; normalize trim/uppercase.
- **R-JOIN-2**: Unknown/malformed code → clear error, no membership.
- **R-JOIN-3**: Duplicate membership → no new row, navigate/keep dashboard.
- **R-JOIN-4**: On success navigate to `/team`.
- **R-JOIN-5**: Explain local-only behavior when a code cannot be resolved.

## Deep-linking

- Scheme `pausa://`; `/team`, `/team/create`, and `/team/join` are reachable and obey the profile guard.
