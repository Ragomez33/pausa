# Feature Specification: Teams & Level Challenges

**Feature Branch**: `010-teams-challenges`

**Created**: 2026-10-19

**Status**: Draft

**Input**: User description: "Implementar la estructura de datos local y la interfaz para la gestión de Equipos/Escuadrones (Teams) y Retos por Niveles. teams con id uuid, name, invite_code único, difficulty_level (facil/medio/dificil/modo_dios), duration_days, created_at. team_members con id uuid, team_id, user_name, daily_limit y role (leader/member). Pantallas para crear equipo (nombre, duración, nivel) o unirse por código de invitación. Calcular daily_limit según daily_cigarettes del perfil y nivel. Dashboard de escuadrón con métricas colectivas (posposiciones, cigarrillos evitados, dinero ahorrado), métrica individual (fumados hoy vs límite) y leaderboard con El Guardián, El Inquebrantable y El Resiliente. Almacenamiento local con Drizzle y UI NativeWind."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create a Team Challenge (Priority: P1)

A person creates a squad by choosing a team name, a challenge duration, and a difficulty level. The app generates a unique invitation code, assigns the creator as leader, and calculates their daily cigarette limit from their profile and the selected level.

**Why this priority**: Creating a team is the entry point for every team feature; without it there is no challenge, code, or dashboard.

**Independent Test**: Create a team with a known profile and level, then verify the stored team fields, generated invite code, the creator's leader role, and the calculated daily limit.

**Acceptance Scenarios**:

1. **Given** the create-team screen, **When** it opens, **Then** it offers a name field, a duration, and levels Fácil, Medio, Difícil, and Modo Dios.
2. **Given** a valid name, duration, and level, **When** the person submits, **Then** a team is stored with a unique invite code, difficulty level, duration days, and creation moment.
3. **Given** a successful creation, **Then** the creator is stored as a leader with a daily limit calculated from their profile level and the challenge level.
4. **Given** a missing name, invalid duration, or missing level, **When** submitted, **Then** creation is blocked with a clear message.
5. **Given** a generated invite code, **Then** it is unique among locally stored teams and easy to share.
6. **Given** a storage failure, **Then** no partial team or member is presented as created.

---

### User Story 2 - Join a Team by Invite Code (Priority: P2)

The person joins an existing squad by entering its invitation code. The app finds the local team, adds them as a member with a daily limit based on the challenge level, and prevents duplicate membership.

**Why this priority**: Joining is the second half of team setup and makes invitation codes useful.

**Independent Test**: Create a team, then join it from the join screen using its code; verify a member row with the correct team reference, name, daily limit, and member role. Try an invalid code and a duplicate join and verify both are blocked.

**Acceptance Scenarios**:

1. **Given** the join screen, **When** it opens, **Then** it offers an invite-code field.
2. **Given** a valid code for a locally stored team, **When** submitted, **Then** the person is added as a member with the correct team reference and calculated daily limit.
3. **Given** an unknown or malformed code, **When** submitted, **Then** joining is blocked with a clear message.
4. **Given** the person is already a member of that team, **When** they try to join again, **Then** no duplicate membership is created.
5. **Given** a successful join, **Then** the squad dashboard is available for that team.
6. **Given** no local team matches the code, **Then** the screen explains that only teams available on this device can be joined.

---

### User Story 3 - See the Squad Dashboard (Priority: P3)

The person opens the squad dashboard and sees the challenge summary, collective metrics, and each member's status: cigarettes smoked today compared with their daily limit.

**Why this priority**: The dashboard converts team setup into shared progress and accountability.

**Independent Test**: Seed a team with members and known local progress, open the dashboard, and verify the collective totals and each member's today/limit value match the stored data.

**Acceptance Scenarios**:

1. **Given an active team, **When** the dashboard opens, **Then** it shows the team name, difficulty level, duration, remaining days, and invite code.
2. **Given locally stored member progress, **When** the dashboard renders, **Then** collective postponements, avoided cigarettes, and money saved are shown.
3. **Given multiple members, **When** the dashboard renders, **Then** each member shows smoked-today versus their daily limit.
4. **Given no active team, **When** the dashboard opens, **Then** a clear empty state offers create/join actions.
5. **Given a member has no recorded progress, **Then** their values show zero/empty without crashing.

---

### User Story 4 - Recognize Team Distinctions (Priority: P4)

The squad dashboard includes a leaderboard with three distinctions: the member with the most postponed cigarettes, the member with the longest streak of days within their limit, and the member who had a stumble but stayed within the goal.

**Why this priority**: Recognition turns individual effort into team motivation, but depends on the team and dashboard existing.

**Independent Test**: Seed members with known postponed counts, streaks, and stumble status, open the leaderboard, and verify each distinction is assigned to the correct member and that ties are resolved consistently.

**Acceptance Scenarios**:

1. **Given multiple members, **When** the leaderboard renders, **Then** "El Guardián" is assigned to the member with the most postponed cigarettes.
2. **Given members with different streaks, **Then** "El Inquebrantable" is assigned to the longest streak of days within the limit.
3. **Given a member who had a stumble but stayed within the goal, **Then** "El Resiliente" recognizes that member.
4. **Given ties, **Then** the winner is chosen deterministically (for example by name order) and the result is stable across reloads.
5. **Given no eligible member for a distinction, **Then** the card shows an empty state instead of a false winner.

---

### Edge Cases

- What happens when no profile exists? The person must complete onboarding before creating/joining a team or calculating limits.
- What happens when the profile's daily average is zero? The calculated daily limit is zero, shown clearly without division errors.
- What happens when the invite code contains spaces or lowercase letters? Input is normalized (trim/case-insensitive) before lookup.
- What happens when two teams would receive the same code? A new unique code is generated.
- What happens when the same person joins twice? No duplicate membership.
- What happens when the team has no members beyond the creator? The dashboard shows the single member and empty leaderboard states.
- What happens when the challenge duration has elapsed? The dashboard shows it as completed/expired while preserving history.
- What happens when the difficulty is invalid or missing? Creation/joining is blocked.
- What happens when local storage fails? A clear error is shown and no partial team/member is saved.
- What happens when a member has no progress snapshot? Zeros/empty state, never a crash.
- What happens when the invite code belongs to a team on another device? It cannot be resolved locally, and the app explains the local-only limitation.

## Requirements *(mandatory)*

### Functional Requirements

EARS-syntax requirements (per constitution section 4):

- **FR-001** (Ubiquitous): The system shall store teams locally with a unique identifier, name, unique invite code, difficulty level, duration in days, and creation moment.
- **FR-002** (Ubiquitous): The system shall support exactly four difficulty levels: Fácil, Medio, Difícil, and Modo Dios.
- **FR-003** (Ubiquitous): The system shall store team members with a unique identifier, team reference, user name, daily limit, and role.
- **FR-004** (Ubiquitous): The system shall support exactly two member roles: leader and member.
- **FR-005** (Event-driven): WHEN a team is created, the system shall assign the creator as leader and generate a unique invite code.
- **FR-006** (Ubiquitous): The daily limit shall be calculated from the profile's daily cigarette average and the selected difficulty level.
- **FR-007** (Event-driven): WHEN the create-team form is submitted with valid data, the system shall persist the team and leader membership together or not at all.
- **FR-008** (Event-driven): WHEN the join form is submitted, the system shall normalize the code, find the matching local team, and add the person as a member.
- **FR-009** (Unwanted Behavior): IF the invite code is missing, malformed, or not found locally, THEN the system shall block joining with a clear message.
- **FR-010** (Unwanted Behavior): IF the person is already a member of the team, THEN the system shall not create a duplicate membership.
- **FR-011** (Event-driven): WHEN the squad dashboard opens, the system shall show the team name, difficulty, duration, remaining days, and invite code.
- **FR-012** (Ubiquitous): The dashboard shall show collective postponements, avoided cigarettes, and money saved derived from locally stored member progress.
- **FR-013** (Ubiquitous): The dashboard shall show each member's cigarettes smoked today versus their daily limit.
- **FR-014** (Event-driven): WHEN the leaderboard renders, the system shall assign "El Guardián" to the member with the most postponed cigarettes.
- **FR-015** (Event-driven): WHEN the leaderboard renders, the system shall assign "El Inquebrantable" to the member with the longest streak of days within their limit.
- **FR-016** (Event-driven): WHEN the leaderboard renders, the system shall assign "El Resiliente" to a member who had a stumble but stayed within the goal.
- **FR-017** (Unwanted Behavior): IF multiple members tie, THEN the system shall resolve the distinction deterministically and consistently.
- **FR-018** (State-driven): WHILE no active team exists, the dashboard shall show a clear empty state with create/join actions.
- **FR-019** (State-driven): WHILE no profile exists, the system shall route the person to onboarding and shall not create/join teams.
- **FR-020** (Unwanted Behavior): IF local storage fails, THEN the system shall not persist a partial team or membership and shall show a clear error.
- **FR-021** (Ubiquitous): The system shall keep all team, membership, and progress data local, with no network calls in this feature.
- **FR-022** (Ubiquitous): The team interface shall use clean, direct, responsive utility-styled native components.

### Key Entities *(include if feature involves data)*

- **Team**: A local squad challenge.
  - Unique identifier (text/UUID)
  - Name
  - Invite code (unique, normalized)
  - Difficulty level (`facil`, `medio`, `dificil`, `modo_dios`)
  - Duration in days
  - Creation moment
- **Team Member**: A participant in a team.
  - Unique identifier (text/UUID)
  - Team reference
  - User name
  - Daily limit for the level
  - Role (`leader`, `member`)
- **Member Progress Snapshot** (local/derived): The data used for dashboard and leaderboard.
  - Postponed count
  - Smoked today
  - Streak of days within limit
  - Whether the member had a stumble while staying within goal
- **Team Summary** (derived): Team metadata plus collective postponed count, avoided cigarettes, money saved, and remaining days.
- **Leaderboard Distinction** (derived): Guardián, Inquebrantable, Resiliente assignments with tie-break.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of created teams have all required fields, a unique invite code, and a leader membership.
- **SC-002**: 100% of joined teams add exactly one membership with the calculated daily limit; duplicate joins create 0 additional rows.
- **SC-003**: The calculated daily limit matches the chosen level formula in 100% of tested profile/level combinations, including a zero profile.
- **SC-004**: The dashboard collective and individual metrics match manual calculations from local snapshots in 100% of tested datasets.
- **SC-005**: Each leaderboard distinction is assigned to the correct eligible member in 100% of tested cases; ties resolve deterministically with 0 unstable winners.
- **SC-006**: Empty team/member/progress states render without crashes in 100% of tested cases.
- **SC-007**: 100% of team operations remain local, with 0 network requests.
- **SC-008**: A person can create a team or join one in under 60 seconds.
- **SC-009**: Invalid names, durations, levels, and invite codes are blocked with a visible message in 100% of tested cases.

## Clarification Gates

The constitution requires open product decisions to be stated before planning. The following points have recommended defaults and remain open for confirmation before `/speckit.plan`.

1. **Daily limit formula by level**
   - Context: The request says the limit comes from the profile average and level but gives no percentages.
   - Recommended default: Fácil = 100% of the daily average, Medio = 75%, Difícil = 50%, Modo Dios = 25%, rounded down with a minimum of 0.
   - Alternative: Fixed caps per level (for example 20/15/10/5) independent of the profile.

2. **Local-only joining**
   - Context: Teams are stored locally with no network, so an invite code can only resolve to a team already on this device.
   - Recommended default: Joining searches local teams only and clearly explains that cross-device joining requires future synchronization.
   - Alternative: Simulate remote lookup with seeded demo teams, or add a backend (out of scope).

3. **Source of member progress**
   - Context: The app has a single local profile, but the dashboard requires collective and per-member metrics.
   - Recommended default: Store local progress snapshots per team member; the local user's snapshot reflects real app activity, while other local members start at zero and can be used for demo/seeded data until synchronization exists.
   - Alternative: Show only the current user's real metrics and mark other members as unavailable.

## Assumptions

- The app remains local-first; no network or real multi-device team synchronization is introduced.
- The local user is the only real member; additional members may be local placeholders/demo data until sync exists.
- One active team is shown on the dashboard at a time (the most recently created/joined team).
- The creator's user name defaults to "Tú"; joined members also use "Tú" unless a local display name is added later.
- Invite codes are short, uppercase, alphanumeric, and unique among local teams.
- Daily limits are whole cigarettes and never negative.
- Leaderboard ties are resolved deterministically by user name and then membership identifier.
- "El Resiliente" requires at least one stumble and a current status within the goal.
- Challenge duration is measured from the creation moment in local days.
- Existing onboarding, profile, awareness, smoking, and notification flows remain in place.
- No heavy libraries are added; the UI uses native components with utility styling.
