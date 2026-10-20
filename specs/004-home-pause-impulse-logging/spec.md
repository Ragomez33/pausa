# Feature Specification: Home Metrics & Pause Impulse Logging

**Feature Branch**: `004-home-pause-impulse-logging`

**Created**: 2026-10-19

**Status**: Draft

**Input**: User description: "Implementar la pantalla principal (Home), el flujo interactivo del Botón 'Pausa' y el registro de impulsos en la base de datos local. Consultar user_profile y pause_events para calcular tiempo transcurrido desde el inicio/última recaída, cigarrillos no fumados, dinero ahorrado y contadores de impulsos resistidos/cedidos. Crear el botón Pausa, una intervención breve con temporizador/respirador de 10-15 segundos, selector de disparador (Ansiedad, Estrés, Aburrimiento, Hábito/Social, Ira/Frustración), notas opcionales y acciones 'Logré Pausar' / 'Cedí / Fumé' que persisten en pause_events. Tras guardar, refrescar el Home y mostrar un mensaje de refuerzo."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See Essential Progress and Act on Home (Priority: P1)

A person with a saved profile opens the app and lands on a focused home screen. The screen shows only their current streak and today's resisted versus ceded impulses, followed by one large central action to pause before smoking. Detailed financial and consumption metrics live in History/Statistics.

**Why this priority**: The home screen must make the next action obvious. Secondary metrics support reflection, but they should not compete with the pause action.

**Independent Test**: Seed a profile and a known set of pause events, open home, and verify that elapsed time and today's resisted/ceded counts match the stored data; confirm secondary metrics are shown in History; change the records and confirm both views update.

**Acceptance Scenarios**:

1. **Given** a stored profile and no impulse history, **When** home opens, **Then** it shows the elapsed time since the profile was created and zero resisted/ceded counts without crashing.
2. **Given** a stored profile and a mix of resisted and ceded impulses, **When** home opens, **Then** it shows only the streak card and a compact today summary (`N Pausa(s) | N Fumado(s)`), plus the central action and navigation.
3. **Given** the most recent impulse was ceded, **When** home opens, **Then** elapsed time restarts from that ceded impulse and the today summary reflects the stored counts.
4. **Given** home is visible, **When** time passes or the person returns to home, **Then** the displayed elapsed time and today summary refresh without requiring an app restart.
5. **Given** the home screen, **When** the person views the header navigation, **Then** it offers Inicio, Historial, Inventario, Logros, and Equipo as fixed top tabs with clearly distinct active and inactive states.
6. **Given** the home screen, **When** the person taps the Equipo tab, **Then** the squad screen opens at `/team` without a back action.
7. **Given** the person wants avoided cigarettes, money saved, inventory spending, or pack information, **When** they open History/Statistics, **Then** those values are available there.

---

### User Story 2 - Pause Before Acting on an Impulse (Priority: P2)

When an urge appears, the person taps the prominent Pausa button on home. The app opens a short intervention that guides them through a breathing countdown of 10–15 seconds. Only after the countdown finishes can they choose what happened.

**Why this priority**: The brief pause is the core habit-breaking mechanic. It must exist before outcomes can be recorded.

**Independent Test**: From home, tap Pausa, confirm the countdown runs for 10–15 seconds and that outcome controls are unavailable during it, then confirm they become available when it finishes; leave the screen mid-countdown and confirm no impulse is stored.

**Acceptance Scenarios**:

1. **Given** the home screen, **When** the person taps the Pausa button, **Then** the intervention screen opens.
2. **Given** the intervention screen, **When** it starts, **Then** a visible breathing/countdown timer runs for 10–15 seconds.
3. **Given** the timer is running, **When** the person tries to choose an outcome, **Then** the outcome controls are unavailable or blocked.
4. **Given** the timer is running, **When** the person leaves the screen, **Then** no impulse event is stored.
5. **Given** the timer has finished, **When** the person views the screen, **Then** the trigger selector and outcome actions become available.

---

### User Story 3 - Record the Impulse and Return with Feedback (Priority: P3)

After the breathing pause, the person selects what triggered the urge, optionally adds a short note, and records whether they resisted or gave in. The event is stored locally. They return to home, see updated progress, and receive an encouraging confirmation that reinforces the pause.

**Why this priority**: Recording the outcome turns a moment of awareness into durable progress data and powers every home metric.

**Independent Test**: Complete the intervention with each trigger and both outcomes, confirm each event is stored with its trigger, outcome, timestamp, and optional note, then confirm home updates and shows the confirmation message.

**Acceptance Scenarios**:

1. **Given** the timer completed, **When** the person selects a trigger and confirms "Logré Pausar", **Then** an event is stored as resisted and the person returns home with updated metrics and a positive confirmation.
2. **Given** the timer completed, **When** the person selects a trigger and confirms "Cedí / Fumé", **Then** an event is stored as ceded, the streak window restarts from that event, and the person returns home with updated metrics and a supportive confirmation.
3. **Given** a trigger is not selected, **When** the person tries to confirm an outcome, **Then** saving is blocked and a clear message asks them to choose a trigger.
4. **Given** optional notes are empty or short, **When** the person saves, **Then** the event is stored with or without notes without blocking the save.
5. **Given** the person taps an outcome action repeatedly, **When** the first save succeeds, **Then** only one event is stored.

---

### Edge Cases

- What happens when no profile exists? The person MUST be routed to onboarding instead of seeing home metrics.
- What happens when the pack cost is zero? Money saved MUST display zero without division or formatting errors.
- What happens when daily cigarette count is zero or missing? Avoided cigarettes and money MUST be zero and the screen MUST remain usable.
- What happens when the device clock is adjusted backwards or a stored timestamp is in the future? Elapsed time MUST never be negative; it is treated as zero.
- What happens when there are no ceded impulses? The elapsed-time window starts at profile creation.
- What happens when the app is backgrounded during the countdown? The intervention MUST resume in a valid state and MUST NOT allow saving before the countdown completes.
- What happens when the trigger is not selected? The save MUST be blocked with a clear message.
- What happens when storage fails while saving? The event MUST NOT be partially stored, and a clear error MUST be shown.
- What happens when the person leaves the intervention before saving? Nothing is stored.
- What happens when the person saves and returns home? The home metrics MUST reflect the new event without an app restart.

## Requirements *(mandatory)*

### Functional Requirements

EARS-syntax requirements (per constitution section 4):

- **FR-001** (Ubiquitous): The home screen shall display progress derived from the stored user profile and stored impulse events.
- **FR-002** (Ubiquitous): The home screen shall display elapsed time since the current streak began.
- **FR-003** (Ubiquitous): The home screen shall display a compact today summary with the resisted and ceded impulse counts.
- **FR-004** (Ubiquitous): The History/Statistics view shall display the number of cigarettes avoided, estimated money saved, and cumulative inventory spending derived from stored records.
- **FR-005** (Ubiquitous): The home screen shall not display avoided cigarettes, money saved, inventory spending, or pack-count cards.
- **FR-006** (Event-driven): WHEN the home screen becomes visible or its underlying records change, the system shall recalculate the displayed streak and today summary.
- **FR-007** (State-driven): WHILE the home screen is visible, the system shall refresh elapsed-time-based metrics periodically so they do not appear frozen.
- **FR-008** (Event-driven): WHEN the person taps the Pausa button on home, the system shall open the intervention view.
- **FR-009** (Event-driven): WHEN the intervention view opens, the system shall start a visible breathing/countdown timer lasting between 10 and 15 seconds.
- **FR-010** (State-driven): WHILE the breathing timer is running, the system shall prevent outcome selection.
- **FR-011** (Event-driven): WHEN the breathing timer finishes, the system shall reveal the trigger selector and outcome actions.
- **FR-012** (Ubiquitous): The intervention view shall offer the trigger options "Ansiedad", "Estrés", "Aburrimiento", "Hábito/Social", and "Ira/Frustración".
- **FR-013** (Optional Feature): WHERE the person enters a short note, the system shall store it with the impulse event.
- **FR-014** (Event-driven): WHEN the person confirms "Logré Pausar" with a selected trigger, the system shall store the impulse as resisted.
- **FR-015** (Event-driven): WHEN the person confirms "Cedí / Fumé" with a selected trigger, the system shall store the impulse as ceded and reset the streak window start to that event.
- **FR-016** (Event-driven): WHEN an impulse is saved successfully, the system shall return the person to home, recalculate the metrics, and show a reinforcing confirmation message.
- **FR-017** (Unwanted Behavior): IF no trigger is selected, THEN the system shall block saving and communicate the requirement clearly.
- **FR-018** (Unwanted Behavior): IF local storage fails during save, THEN the system shall not persist a partial event and shall show a clear, user-visible error.
- **FR-019** (Unwanted Behavior): IF the person leaves the intervention before saving, THEN the system shall persist nothing.
- **FR-020** (Unwanted Behavior): IF an outcome action is triggered repeatedly, THEN the system shall store at most one event per completed intervention.
- **FR-021** (State-driven): WHILE no profile exists, the system shall block access to home metrics and route the person to onboarding.
- **FR-022** (Ubiquitous): The system shall compute all money and avoided-cigarette values dynamically from locally stored records and shall never hardcode them.
- **FR-023** (Ubiquitous): The system shall keep all impulse data on the device without network synchronization.
- **FR-024** (Ubiquitous): The intervention timer shall remain visually smooth and responsive for its full duration without heavy external graphics or animation dependencies.
- **FR-025** (Ubiquitous): The main views shall display a fixed top tab bar with Inicio, Historial, Inventario, Logros, and Equipo.
- **FR-026** (Event-driven): WHEN the person taps the Equipo tab, the system shall navigate to the team screen at `/team` without requiring a back action.
- **FR-027** (State-driven): WHILE a main tab is active, the system shall visually distinguish it from the remaining destinations.
- **FR-028** (Ubiquitous): The home screen shall present two high-contrast cards: current streak and today's resisted/ceded summary.
- **FR-029** (Ubiquitous): The Pausa call-to-action shall be a large brand-orange circle centered in the available screen space, with a cigarette icon and white bold text "Quiero fumar".
- **FR-030** (Ubiquitous): The Pausa call-to-action shall not include interior subtitles or explanatory filler text.
- **FR-031** (Ubiquitous): The home screen shall not include the phrases "Menos humo, más control. Un día a la vez.", "¿Aparece un impulso?", "Respira primero. La decisión puede esperar.", or "Activa una pausa de 12 segundos...".
- **FR-032** (Ubiquitous): Visual redesign changes shall not alter the metric calculations or the persistence behavior defined in FR-001 through FR-024.
- **FR-033** (Ubiquitous): The main navigation shall be a fixed top tab bar with five equal-width tabs (Inicio, Historial, Inventario, Logros, Equipo) that fit within the screen width without horizontal scrolling and keep Equipo fully visible.

### Key Entities *(include if feature involves data)*

- **User Profile**: The person's baseline for calculations.
  - Daily cigarette average (positive integer)
  - Pack cost (non-negative decimal)
  - Currency code
  - Creation timestamp (defines the initial streak start)
- **Pause Event**: A recorded urge episode.
  - Event timestamp (ISO date-time)
  - Trigger emotion (one of the five predefined triggers)
  - Outcome: resisted or ceded
  - Notes (optional short text)
- **Derived Home Metrics** (not stored):
  - Current streak start: profile creation time, or the most recent ceded event when one exists
  - Elapsed time: now minus the current streak start (never negative)
  - Cigarettes avoided: daily average × elapsed time in days
  - Money saved: `(cigarettes avoided / 20) × pack cost`
  - Resisted count and ceded count

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of displayed home streak and today-summary values match a manual calculation from the same stored profile and impulse records, with 0 hardcoded values.
- **SC-002**: A person can open the intervention, complete the countdown, record an impulse, and return to home in under 60 seconds.
- **SC-003**: 100% of attempts to record an outcome before the countdown finishes are blocked, with 0 events stored early.
- **SC-004**: 100% of saved impulses retain their trigger, resisted/ceded outcome, timestamp, and optional notes after an app restart.
- **SC-005**: After a successful save, home shows the updated metrics on the first return, with 0 app restarts required.
- **SC-006**: Repeated taps on an outcome action produce at most one stored event in 100% of tested cases.
- **SC-007**: When the most recent impulse is ceded, the elapsed-time window restarts from that event in 100% of tested cases.
- **SC-008**: The intervention shows an actionable confirmation after saving in 100% of successful saves, and a clear error in 100% of simulated storage failures.
- **SC-009**: The breathing countdown remains responsive for its full 10–15 second duration with no visible freezing.
- **SC-010**: 100% of taps on the header navigation open the expected destination; the Equipo item opens `/team` in 100% of tested cases.
- **SC-011**: The active navigation item is visually distinguishable from inactive items in 100% of tested screens.
- **SC-012**: The home screen shows the navigation, two summary cards, and the centered circular Pausa action without requiring scroll on supported phone heights.
- **SC-013**: The secondary metrics (avoided cigarettes, money saved, inventory spending) are available in History/Statistics in 100% of tested datasets.
- **SC-014**: All five tabs fit within the screen width, Equipo is 100% visible without horizontal scrolling, and the active tab is highlighted in 100% of tested standard phone widths.

## Clarification Gates

The constitution requires open product decisions to be stated before planning. The following points have recommended defaults and remain open for confirmation before `/speckit.plan`.

1. **Metric window (streak vs lifetime)**
   - Context: The request asks for elapsed time since start/last relapse, avoided cigarettes, money saved, and resisted/ceded counters, but does not say whether counters reset on a relapse.
   - Recommended default: Counters are lifetime totals; elapsed time, avoided cigarettes, and money saved cover the current streak window (since profile creation or the latest ceded impulse). This keeps historical achievements visible while making the savings window intuitive.
   - Alternative: Reset every metric on each ceded impulse, or keep every metric lifetime including elapsed time.

2. **Definition of streak start and relapse**
   - Context: "Inicio/última recaída" is not defined in stored data.
   - Recommended default: The initial start is the profile creation timestamp; every ceded impulse becomes the new start. A resisted impulse never resets the window.
   - Alternative: Use the first stored impulse as the start, or add a separate explicit relapse record.

3. **Trigger taxonomy**
   - Context: The requested Spanish labels differ from the trigger codes currently stored by the app.
   - Recommended default: Replace the current option set with "Ansiedad", "Estrés", "Aburrimiento", "Hábito/Social", and "Ira/Frustración", preserving existing stored events through a compatible mapping where possible.
   - Alternative: Keep both old and new options, or migrate all historical triggers to "Otro".

## Assumptions

- The app is local-first; profile and impulse data never leave the device in this feature.
- "Inicio" is the profile creation moment until a ceded impulse occurs; the latest ceded impulse becomes the new start.
- A person records at most one outcome per intervention session.
- The breathing countdown defaults to 12 seconds, within the required 10–15 second range.
- Home metrics refresh on screen focus, after a save, and on a short periodic interval while visible (at least once per minute) so elapsed time feels live.
- Notes are optional, limited to a short length (about 200 characters), and are not required to save.
- The five requested trigger labels are the complete user-facing set; stored codes may be adjusted during planning while keeping historical data readable.
- "Logré Pausar" maps to a resisted outcome; "Cedí / Fumé" maps to a ceded outcome and is the only event that resets the streak.
- The existing onboarding/profile existence guard and local database layer remain in place; this feature builds on them.
- The breathing visual remains lightweight and smooth, with simple visual changes rather than a heavy graphics or animation dependency.
- Currency formatting uses the profile's currency; if the currency is invalid, a readable fallback is shown.
