# Feature Specification: Awareness Loop & Smoking Session

**Feature Branch**: `008-awareness-loop-smoking`

**Created**: 2026-10-19

**Status**: Draft

**Input**: User description: "Reestructurar los flujos principales para alinearse con el concepto original: Loop de Conciencia, Temporizador de Fumado, Mensajes Concretos, Notificaciones Locales y Soporte de Equipos. Home debe ofrecer 'Quiero fumar' y abrir el loop: ¿Puedes posponerlo? Sí incrementa posponed_count y vuelve al Home; No avanza al selector de emoción (Ansiedad/Estrés, Aburrimiento, Costumbre, Presión Social), luego un mensaje consciente rudo rotativo y 'Iniciar Cigarrillo' abre la sesión de fumado. La sesión muestra un temporizador en vivo, pregunta '¿Terminaste?' cada 5 minutos, y al terminar resta 1 cigarrillo del inventario, registra el evento con duración exacta y actualiza los contadores diarios. Notificaciones locales de inactividad basadas en daily_cigarettes/horas despierto con el mensaje 'Tienes ganas de fumar? Abre la app antes de encenderlo.' Añadir esquema de teams/team_members, posponed_count y stubs de ranking (El Guardián, El Inquebrantable, El Resiliente). Banco de mensajes rudos reales."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Pause Before Smoking with the Awareness Loop (Priority: P1)

When the urge to smoke appears, the person taps the primary home action "Quiero fumar" / "Tengo ganas de fumar". The app asks whether they can postpone. Choosing "Sí" records a postponement, shows an encouraging message, and returns home. Choosing "No" continues to an emotion selector, then a frank awareness message, and finally the option to start a smoking session.

**Why this priority**: This is the product's core behavior-change loop. It must exist before sessions, reminders, or team features have meaning.

**Independent Test**: From home, complete both branches: postpone (count increases by one, no smoking session starts) and continue through emotion → message → start session; verify each step appears in order and only the expected data is recorded.

**Acceptance Scenarios**:

1. **Given** the home screen, **When** it renders, **Then** the primary action reads "Quiero fumar" or "Tengo ganas de fumar" and replaces the previous Pausa action.
2. **Given** the loop starts, **When** it opens, **Then** the first question is "¿Puedes posponerlo?".
3. **Given** the postpone question, **When** the person chooses "Sí", **Then** the postponement count increases by exactly one, a positive message appears, and the person returns home without a smoking session.
4. **Given** the postpone question, **When** the person chooses "No", **Then** the emotion selector appears.
5. **Given** the emotion selector, **When** it renders, **Then** it offers Ansiedad/Estrés, Aburrimiento, Costumbre, and Presión Social.
6. **Given** an emotion is selected, **When** the person continues, **Then** a frank awareness message from the predefined bank appears.
7. **Given** the awareness message, **When** the person taps "Iniciar Cigarrillo", **Then** the smoking session opens.
8. **Given** the loop is abandoned before starting a session, **Then** no smoking event or inventory change is recorded.

---

### User Story 2 - Track the Smoking Session and Finish (Priority: P2)

During a smoking session, the person sees a live timer. Every five minutes the app sends a local system notification asking "¿Terminaste?", even while the app is backgrounded. When they confirm, the app subtracts one cigarette from inventory, records the session duration in seconds, and updates today's smoked-versus-limit counters.

**Why this priority**: The session timer turns an automatic habit into a measured event and feeds inventory, daily limits, and history.

**Independent Test**: Start a session, background the app, and verify local notifications arrive at five-minute intervals for up to one hour; tap one to reopen the active session, choose to continue, then finish; verify the elapsed duration, one-cigarette inventory decrease, today's counter update, and that no in-app alert interrupts the timer. Start and abandon another session and verify nothing is recorded.

**Acceptance Scenarios**:

1. **Given** a session starts, **When** the session screen opens, **Then** a live elapsed timer is visible without any emergent in-app modal, and notifications are scheduled every five minutes for up to twelve intervals.
2. **Given** five minutes elapse, **When** the timer reaches the five-minute mark, **Then** a local system notification asks "¿Terminaste?"; the app shows no popup or alert.
3. **Given** the notification, **When** the person taps it, **Then** the app opens the active session reconstructed from local storage with its real elapsed time.
4. **Given** more than thirty minutes have elapsed since the session started, **When** the session opens, **Then** the screen shows a non-blocking inline card to finish it or discard it without recording an event.
5. **Given** the person taps "Terminé", **Then** the session duration is recorded in seconds, one cigarette is subtracted from inventory, and today's smoked counter increases by one.
6. **Given** no inventory is available, **When** the session finishes, **Then** the session is still recorded, inventory never becomes negative, and a clear notice explains the stock situation.
7. **Given** the person leaves before finishing, **Then** no session event is stored, inventory is unchanged, and pending session notifications are cancelled.
8. **Given** repeated "Terminé" taps, **Then** only one session is recorded.

---

### User Story 3 - Receive Local Inactivity Reminders (Priority: P3)

Based on the person's configured daily cigarette average and an assumed waking window, the app schedules local reminders that invite them to open the app before lighting up.

**Why this priority**: Reminders extend the awareness loop beyond the moment the app is open, but depend on the loop and profile existing.

**Independent Test**: With a profile and notification permission granted, schedule reminders and verify the interval matches the profile-based frequency and the message text is exact. Deny permission and verify the app remains usable without reminders.

**Acceptance Scenarios**:

1. **Given** a profile with a daily cigarette average, **When** reminders are scheduled, **Then** the interval is based on the waking window divided by the daily average.
2. **Given** reminders are scheduled, **Then** the message reads "Tienes ganas de fumar? Abre la app antes de encenderlo."
3. **Given** notification permission is denied or unavailable, **Then** the app continues working and explains that reminders are disabled.
4. **Given** reminders are already scheduled, **When** the app is reopened, **Then** duplicate schedules are not created.
5. **Given** no profile exists, **Then** no reminders are scheduled.

---

### User Story 4 - Prepare Team Challenges and Rankings (Priority: P4)

The app stores the foundation for team challenges and shows a stub ranking view with the product's rank names, so future team features can build on it without another schema overhaul.

**Why this priority**: Team support is requested but secondary to the personal awareness and smoking flows; the foundation prevents future rework.

**Independent Test**: Create a team and members locally, open the team/ranking view, and verify the stored fields and the presence of the three rank labels as stubs; empty data shows a clear empty state.

**Acceptance Scenarios**:

1. **Given** the team foundation exists, **When** a team is stored, **Then** it has a name, goal level (`facil`, `medio`, `dificil`, `modo_dios`), duration in days, and creation moment.
2. **Given** a team member is stored, **Then** it references the team, has a local user/name, a daily limit, and a status.
3. **Given** the ranking view opens, **Then** it shows stub sections for "El Guardián", "El Inquebrantable", and "El Resiliente".
4. **Given** there are no teams or members, **Then** the ranking stub shows a clear empty state.
5. **Given** the personal metrics, **Then** the postponement count is available as a user metric.

---

### Edge Cases

- What happens when no profile exists? The person MUST be routed to onboarding; the loop, session, reminders, and team data MUST not run against a missing profile.
- What happens when the postponement count is incremented twice by a double tap? Only one postponement per completed loop.
- What happens when the person leaves the loop mid-way? Nothing is persisted unless the postpone branch was confirmed.
- What happens when the inventory has zero cigarettes at session finish? The session is recorded, stock stays at zero, and a clear notice is shown.
- What happens when the daily limit is zero or missing? Today's counter still increments, and the limit displays as unavailable rather than dividing by zero.
- What happens when the app is backgrounded during a session? Wall-clock time is preserved and local notifications continue to fire every five minutes; the session is reconstructed from SQLite if the app is reopened.
- What happens when the session is abandoned or the app is left? No event or inventory change is stored, the active-session row is cleared, and pending session notifications are cancelled.
- What happens when a session notification is tapped? The app opens the active session with its real elapsed time from local storage.
- What happens when a session exceeds thirty minutes? The app offers finishing it or discarding it without recording an event.
- What happens when the app is closed while a session is active? The persisted active session survives and the scheduled notifications remain; tapping one reopens the session.
- What happens when notification permission is denied for session prompts? The session remains usable without popups, and a single explanatory notice is shown.
- What happens when the reminder interval would be extremely short? It is clamped to a sensible minimum (for example 30 minutes) and remains within waking hours.
- What happens when notifications are denied or unavailable? The app remains fully usable and informs the person.
- What happens when the same reminder schedule is recalculated? Existing schedules are replaced or deduplicated rather than duplicated.
- What happens when the message bank rotates? A message is always selected from the bank and repeated consecutively only when unavoidable.
- What happens when local storage fails? A clear error is shown and no partial session or postponement is presented as saved.
- What happens when a team has no members? The ranking stub shows an empty state.

## Requirements *(mandatory)*

### Functional Requirements

EARS-syntax requirements (per constitution section 4):

- **FR-001** (Ubiquitous): The home screen shall present a primary action labeled "Quiero fumar" / "Tengo ganas de fumar".
- **FR-002** (Event-driven): WHEN the primary action is activated, the system shall begin the awareness loop.
- **FR-003** (Event-driven): WHEN the awareness loop begins, the system shall ask "¿Puedes posponerlo?".
- **FR-004** (Event-driven): WHEN the person chooses "Sí", the system shall increment the postponement count by one, show a positive message, and return to home without starting a smoking session.
- **FR-005** (Event-driven): WHEN the person chooses "No", the system shall show the emotion selector.
- **FR-006** (Ubiquitous): The emotion selector shall offer Ansiedad/Estrés, Aburrimiento, Costumbre, and Presión Social.
- **FR-007** (Event-driven): WHEN an emotion is selected, the system shall display a frank awareness message selected from a predefined rotating bank.
- **FR-008** (Event-driven): WHEN the person taps "Iniciar Cigarrillo", the system shall open the smoking session.
- **FR-009** (State-driven): WHILE the smoking session is active, the system shall persist its identifier, trigger, and start moment locally and display a live elapsed timer reconstructed from that start moment.
- **FR-010** (Event-driven): WHEN each five-minute interval elapses during a session, the system shall send a local notification asking "¿Terminaste?", including while the app is backgrounded or the screen is locked, and shall not show an emergent in-app prompt.
- **FR-011** (Event-driven): WHEN the person confirms "Terminé", the system shall record the session with its trigger emotion and exact duration in seconds.
- **FR-012** (Event-driven): WHEN a session is recorded, the system shall subtract one cigarette from available inventory.
- **FR-013** (Event-driven): WHEN a session is recorded, the system shall increment today's smoked-cigarette counter and compare it with the profile's daily limit.
- **FR-014** (Unwanted Behavior): IF inventory is empty, THEN the system shall keep stock at zero, still record the session, and show a clear notice.
- **FR-015** (Unwanted Behavior): IF a session is abandoned before confirmation, THEN the system shall store no session, make no inventory change, clear the active-session row, and cancel pending session notifications.
- **FR-016** (Unwanted Behavior): IF "Terminé" is triggered repeatedly, THEN the system shall record at most one session.
- **FR-017** (Event-driven): WHEN the profile and permission allow, the system shall schedule local inactivity reminders based on the daily cigarette average and waking window.
- **FR-018** (Ubiquitous): The inactivity reminder message shall read "Tienes ganas de fumar? Abre la app antes de encenderlo."
- **FR-019** (Unwanted Behavior): IF notification permission is denied or unavailable, THEN the system shall keep working and inform the person that reminders are disabled.
- **FR-020** (Unwanted Behavior): IF reminders are recalculated, THEN the system shall not create duplicate schedules.
- **FR-021** (Ubiquitous): The system shall persist the person's postponement count as part of their local metrics.
- **FR-022** (Ubiquitous): The system shall store team challenges with name, goal level, duration, and creation moment.
- **FR-023** (Ubiquitous): The system shall store team members with team reference, local user/name, daily limit, and status.
- **FR-024** (Event-driven): WHEN the team ranking view opens, the system shall show stub sections for "El Guardián", "El Inquebrantable", and "El Resiliente".
- **FR-025** (Ubiquitous): The system shall provide a predefined bank of frank, realistic awareness messages about smell, money, and habit.
- **FR-026** (State-driven): WHILE no profile exists, the system shall route the person to onboarding and shall not run the loop, session, reminders, or team operations.
- **FR-027** (Unwanted Behavior): IF local storage fails, THEN the system shall not present a partial session or postponement as saved and shall show a clear error.
- **FR-028** (Ubiquitous): The system shall keep all loop, session, reminder, and team data on the device without network calls.
- **FR-029** (Ubiquitous): The smoking-session timer shall run without blocking the app's interface.
- **FR-030** (Ubiquitous): The user interface shall use utility-styled native components consistently.
- **FR-031** (Ubiquitous): Each session shall schedule at most twelve five-minute local notifications and shall use a dedicated high-importance Android channel.
- **FR-032** (Event-driven): WHEN a session notification is tapped, the system shall open `/smoking-session` for the persisted active session.
- **FR-033** (State-driven): WHILE an active session is older than thirty minutes, the system shall show a non-blocking inline card offering finishing it or discarding it without recording an event.
- **FR-034** (State-driven): WHILE a smoking session is active, the system shall suspend inactivity reminders.
- **FR-035** (Event-driven): WHEN a session finishes or is discarded, the system shall cancel every pending session notification by identifier prefix without cancelling idle reminders.
- **FR-036** (Ubiquitous): The active-session screen shall not render any modal, alert, or popup that interrupts the timer.
- **FR-037** (Event-driven): WHEN a postponement is confirmed, the system shall insert one resisted pause event with the current timestamp and increment the postponement count atomically.
- **FR-038** (Event-driven): WHEN an inventory consumption is confirmed, the system shall insert the consumption movement and one smoking event per cigarette in the same transaction.

### Key Entities *(include if feature involves data)*

- **Awareness Loop Interaction**: A single urge episode that may end in postponement or a smoking session.
  - Outcome: postponed or continued
  - Selected emotion (for continued episodes)
  - Awareness message shown
  - Moment of the interaction
- **Smoking Session**: A completed smoking event.
  - Start/end moments
  - Trigger emotion
  - Duration in exact seconds
  - Whether inventory was decremented
- **Inventory Movement**: A one-cigarette consumption caused by a completed session; stock never below zero.
- **User Metrics**: Postponement count, cigarettes smoked today, and daily limit.
- **Team**: A challenge group.
  - Name, goal level (`facil`, `medio`, `dificil`, `modo_dios`), duration in days, creation moment
- **Team Member**: A participant.
  - Team reference, local user/name, daily limit, status
- **Reminder Schedule**: Local inactivity notifications derived from the daily average and waking window.
- **Conscious Message**: A predefined frank phrase about smell, money, or habit.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of completed postpone branches increment the postponement count by exactly one and create 0 smoking sessions.
- **SC-002**: 100% of “No” branches present the four required emotions, a bank message, and the "Iniciar Cigarrillo" action in order.
- **SC-003**: A person can complete the awareness loop and reach the session start in under 30 seconds.
- **SC-004**: The smoking timer stays within 1 second of wall-clock elapsed time after being reconstructed from the persisted start moment.
- **SC-005**: A local "¿Terminaste?" notification is delivered at each five-minute interval (up to twelve) in 100% of tested sessions, including while the app is backgrounded or the screen is locked, with 0 in-app popups.
- **SC-006**: 100% of completed sessions record an exact duration, decrement inventory by one when available, and increment today's counter.
- **SC-007**: 0 cases of negative inventory and 0 sessions recorded from abandoned flows.
- **SC-008**: Reminder intervals match the profile-based calculation in 100% of tested configurations, with the exact required message and 0 duplicate schedules.
- **SC-009**: Team records expose all required fields, and the ranking stub shows the three required rank labels in 100% of tested cases.
- **SC-010**: 100% of operations remain local, with 0 network requests.
- **SC-011**: The awareness message always comes from the predefined bank and rotates across consecutive loop runs.

## Clarification Gates

The constitution requires open product decisions to be stated before planning. The following points have recommended defaults and remain open for confirmation before `/speckit.plan`.

1. **Postponement persistence**
   - Context: The request asks to increment `posponed_count`, but the current model records postponements as historical events.
   - Recommended default: Persist a dedicated postponement metric on the user profile while also recording each postponement as an event for traceability; the count is derived/kept consistent with events.
   - Alternative: Store only events and derive the count on demand.

2. **Inventory when empty**
   - Context: A session must subtract one cigarette, but stock may be zero.
   - Recommended default: Record the session, clamp stock at zero, and show a clear notice so the person is informed without blocking the session record.
   - Alternative: Block session completion until inventory is available, or allow negative stock.

3. **Waking window for reminders**
   - Context: The frequency formula divides daily cigarettes by “awake hours”, which the profile does not store.
   - Recommended default: Assume a 16-hour waking window with reminders spaced at `16 / daily_cigarettes` hours, clamped to a 30-minute minimum and confined to waking hours.
   - Alternative: Add a configurable waking window to the profile, or schedule simple fixed intervals.

## Assumptions

- The app remains local-first; no network or team synchronization is implemented in this feature.
- The smoking timer is ascending (elapsed time) and uses wall-clock time from a start moment persisted in SQLite, so it remains accurate while the app is backgrounded or reopened.
- A session is recorded only when the person confirms "Terminé"; leaving or closing the app keeps the persisted active session so its notifications can reopen it, while leaving the screen explicitly discards it.
- Session notifications are local-only, capped at twelve intervals, and use their own identifier prefix so they never interfere with idle reminders.
- The daily limit is the profile's daily cigarette average unless a team member limit overrides it later.
- Today's counter is based on the device's local calendar day.
- The emotion list is exactly Ansiedad/Estrés, Aburrimiento, Costumbre, and Presión Social.
- The message bank is predefined, frank, and rotates between loop runs.
- The waking window defaults to 16 hours and reminder intervals are clamped to a 30-minute minimum.
- Team and ranking support is foundational: schema plus a stub view, not full multiplayer synchronization or leaderboard calculations.
- The three rank names are presentation labels for the stub.
- Existing onboarding, inventory, history, badges, and local persistence remain in place; this feature adapts the primary flow.
- No heavy animation or graphics dependency is introduced.
