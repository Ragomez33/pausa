# Feature Specification: History & Statistics

**Feature Branch**: `006-history-statistics`

**Created**: 2026-10-19

**Status**: Draft

**Input**: User description: "Implementar la pantalla de Historial y Estadísticas detalladas de pausas y consumo en la aplicación local-first. Consultar pause_events ordenado por timestamp descendente y mostrar una lista optimizada con fecha/hora, etiqueta del disparador, estado resisted/cedido y notas opcionales. Calcular tasa de éxito general, desglose de disparadores más frecuentes y racha actual activa de días/horas sin fumar. Usar consultas eficientes y agregaciones locales. Sin dependencias pesadas de gráficos; usar componentes nativos estilizados con NativeWind para barras o porcentajes."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Review Past Impulses (Priority: P1)

A person opens the history screen and sees every recorded impulse from newest to oldest. Each entry shows when it happened, which emotion triggered it, whether the person resisted or gave in, and any note they added.

**Why this priority**: The event history is the foundation of the feature and gives the person direct evidence of their behavior over time.

**Independent Test**: Seed a profile and several pause events with known timestamps, triggers, outcomes, and notes; open the history screen and confirm every entry appears in descending time order with the correct date/time, trigger label, status, and notes.

**Acceptance Scenarios**:

1. **Given** stored pause events, **When** the history screen opens, **Then** events are shown newest first.
2. **Given** an event with a trigger and a resisted outcome, **When** it renders, **Then** it shows the localized date/time, the trigger label, and a success status.
3. **Given** an event with a ceded outcome, **When** it renders, **Then** it shows a clearly different ceded status.
4. **Given** an event with notes, **When** it renders, **Then** the notes are shown; events without notes omit that area.
5. **Given** no stored events, **When** the history screen opens, **Then** a clear empty state is shown instead of a blank or broken list.

---

### User Story 2 - Understand Success and Current Streak (Priority: P2)

The person sees an overall success rate for their impulses and how long their current smoke-free streak has lasted in days and hours.

**Why this priority**: These two numbers turn raw history into immediate motivation and self-awareness.

**Independent Test**: Seed known resisted/ceded events and a known last-ceded moment, open the statistics panel, and verify the success percentage and active streak match manual calculations; confirm zero-event behavior.

**Acceptance Scenarios**:

1. **Given** 3 resisted and 1 ceded event, **When** the statistics panel renders, **Then** the overall success rate is 75%.
2. **Given** no events, **When** the statistics panel renders, **Then** the success rate shows a neutral zero/empty state without division errors.
3. **Given** no ceded event, **When** the active streak is calculated, **Then** it starts at the profile creation moment.
4. **Given** a ceded event after profile creation, **When** the active streak is calculated, **Then** it starts at the most recent ceded event.
5. **Given** the statistics panel, **When** the streak is displayed, **Then** it shows whole days and hours (for example, “3d 4h”).
6. **Given** the statistics panel, **When** it renders, **Then** it also shows avoided cigarettes, money saved, and cumulative inventory spending derived from the stored profile and inventory movements.

---

### User Story 3 - Identify Frequent Triggers (Priority: P3)

The person sees which emotions trigger their impulses most often, with counts and proportional bars so they can recognize patterns.

**Why this priority**: Trigger patterns are the actionable insight that helps the person anticipate and prepare for high-risk moments.

**Independent Test**: Seed events across multiple triggers, open the trigger breakdown, and verify each label, count, percentage, and bar length match the stored distribution; confirm the empty state.

**Acceptance Scenarios**:

1. **Given** events with several triggers, **When** the breakdown renders, **Then** triggers with at least one event are listed from most to least frequent.
2. **Given** a trigger with 3 of 4 total events, **When** the breakdown renders, **Then** it shows a count of 3 and approximately 75% with a proportionally longer bar.
3. **Given** triggers with equal counts, **When** the breakdown renders, **Then** ordering is stable and readable.
4. **Given** no events, **When** the breakdown renders, **Then** a clear empty state is shown.
5. **Given** historical events with older trigger values, **When** they render, **Then** they receive a readable label instead of a raw internal code.

---

### Edge Cases

- What happens when no profile exists? The person MUST be routed to onboarding instead of seeing history.
- What happens when there are no pause events? History, success rate, and trigger breakdown MUST show clear empty states; the streak still derives from the profile creation moment.
- What happens when all events are resisted? Success rate is 100%; trigger breakdown still renders.
- What happens when all events are ceded? Success rate is 0%; the active streak starts at the most recent ceded event.
- What happens when several events share the same timestamp? Ordering is deterministic (newest first, stable tie-break).
- What happens when notes are empty or whitespace? They are omitted.
- What happens when a stored trigger code is unknown? A readable fallback label is shown.
- What happens when the device clock moves backwards? Streak time never becomes negative.
- What happens when local storage fails to read? A clear error state is shown instead of stale or partial data.
- What happens with a very long history? The list remains smooth and memory-conscious, and only what is needed is rendered.

## Requirements *(mandatory)*

### Functional Requirements

EARS-syntax requirements (per constitution section 4):

- **FR-001** (Ubiquitous): The system shall provide a history view of all recorded impulse events for the local user.
- **FR-002** (Ubiquitous): The history view shall order events from most recent to oldest.
- **FR-003** (Ubiquitous): Each history entry shall show the event's localized date and time.
- **FR-004** (Ubiquitous): Each history entry shall show a readable label for its trigger emotion.
- **FR-005** (Ubiquitous): Each history entry shall show whether the impulse was resisted or ceded, using distinct visible states.
- **FR-006** (Optional Feature): WHERE an event has non-empty notes, the history entry shall display them.
- **FR-007** (Event-driven): WHEN the history screen opens or regains focus, the system shall reload the events and statistics.
- **FR-008** (Ubiquitous): The system shall display the overall success rate as the percentage of resisted impulses among all impulses.
- **FR-009** (State-driven): WHILE there are no impulses, the system shall show a neutral success-rate empty state instead of dividing by zero.
- **FR-010** (Ubiquitous): The system shall display the active smoke-free streak in whole days and hours.
- **FR-011** (Event-driven): WHEN calculating the active streak, the system shall start from the profile creation moment unless a later ceded impulse exists, in which case it starts from the most recent ceded impulse.
- **FR-012** (Ubiquitous): The system shall display a breakdown of impulse counts by trigger emotion.
- **FR-013** (Ubiquitous): The trigger breakdown shall show each observed trigger's count and percentage of all impulses.
- **FR-014** (Event-driven): WHEN multiple triggers have events, the breakdown shall order them from most to least frequent with a deterministic tie-break.
- **FR-015** (Event-driven): WHEN a stored trigger code is no longer part of the current selector, the system shall map it to a readable label rather than displaying the raw code.
- **FR-016** (Ubiquitous): The statistics visuals shall use lightweight on-screen bars and counters that remain smooth on the target devices without heavy graphics dependencies.
- **FR-017** (Ubiquitous): The system shall compute counts and grouped totals from the local records without loading unnecessary data into the view layer.
- **FR-018** (Unwanted Behavior): IF local storage cannot be read, THEN the system shall show a clear error state and shall not present partial or stale analytics.
- **FR-019** (Unwanted Behavior): IF no profile exists, THEN the system shall block access to history and route the person to onboarding.
- **FR-020** (State-driven): WHILE no events exist, the history list and trigger breakdown shall show clear empty states.
- **FR-021** (Ubiquitous): The system shall keep all history and analytics processing on the device without network calls or remote synchronization.
- **FR-022** (State-driven): WHILE the device clock or a stored timestamp would produce a negative duration, the system shall display zero elapsed time.
- **FR-023** (Ubiquitous): The statistics panel shall display avoided cigarettes calculated from the profile's daily cigarette average and the active streak window.
- **FR-024** (Ubiquitous): The statistics panel shall display money saved using the avoided-cigarette count and the profile's pack cost.
- **FR-025** (Ubiquitous): The statistics panel shall display cumulative inventory spending derived from stored purchase records.
- **FR-026** (Ubiquitous): These secondary metrics shall be available in History/Statistics even though they are not shown on the home dashboard.

### Key Entities *(include if feature involves data)*

- **Pause Event**: A stored impulse record.
  - Event timestamp (ISO date-time)
  - Trigger emotion (current or historical code)
  - Outcome: resisted or ceded
  - Optional notes
- **User Profile** (read-only): provides the initial streak start and the onboarding guard.
- **History Summary** (derived, not stored):
  - Total impulses
  - Resisted count and ceded count
  - Success rate percentage
  - Avoided cigarettes, money saved, and inventory spending
  - Active streak start (profile creation or latest ceded event)
  - Active streak duration in days and hours
  - Trigger counts and percentages, sorted by frequency

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of stored pause events appear in the history exactly once, in descending time order, with 0 missing or duplicated entries.
- **SC-002**: The success rate, trigger counts, and trigger percentages match a manual calculation in 100% of tested datasets.
- **SC-003**: The active streak matches the defined start rule in 100% of tested cases, including no events, no ceded events, and a recent ceded event.
- **SC-004**: Empty datasets produce clear empty states in 100% of cases, with 0 crashes or division errors.
- **SC-005**: A history of at least 1,000 events opens and scrolls smoothly on a typical device, with the first meaningful view visible within 2 seconds.
- **SC-006**: 100% of historical trigger codes display a readable label, with 0 raw internal codes shown to the person.
- **SC-007**: 100% of analytics remain local, with 0 network requests.
- **SC-008**: When storage read fails, 100% of tested launches show a clear error state, with 0 stale analytics presented.
- **SC-009**: The trigger bars reflect each trigger's share of total impulses in 100% of tested distributions, and their visible lengths are ordered consistently with the counts.

## Clarification Gates

The constitution requires open product decisions to be stated before planning. The following points have recommended defaults and remain open for confirmation before `/speckit.plan`.

1. **Scope of “consumo”**
   - Context: The request title mentions “pausas y consumo”, but the detailed history requirements reference only pause events.
   - Recommended default: This feature covers pause-event history and pause analytics only. Inventory consumption history remains in the inventory module and is not merged into this screen.
   - Alternative: Add a second tab that also lists inventory consumption movements and combines both histories.

2. **Active streak definition**
   - Context: “Racha actual activa de días/horas sin fumar” is not defined against stored events.
   - Recommended default: Start at profile creation, or at the most recent ceded pause event if one exists; display whole days and hours.
   - Alternative: Count consecutive resisted days/hours instead of elapsed time since the last ceded event.

3. **Trigger breakdown coverage**
   - Context: The request lists example emotions but does not say whether triggers with zero events should appear.
   - Recommended default: Show only triggers observed at least once, sorted by count descending; show an empty state when no events exist.
   - Alternative: Always show all five current triggers with zero counts for the missing ones.

## Assumptions

- The app remains local-first; history and analytics never leave the device.
- The history covers pause events only; inventory movements are out of scope unless the scope gate says otherwise.
- The active streak uses the same definition as the Home progress view: profile creation or the most recent ceded pause event.
- Success rate is all-time and uses resisted ÷ total; a zero total shows a neutral state.
- Trigger percentages are based on all impulses and may be rounded for display; bars are proportional to counts.
- Historical trigger codes remain valid and are mapped to human-readable labels.
- Date and time use the device locale and time zone.
- Events are loaded newest first and the list renders incrementally rather than rendering every row at once.
- Aggregated counts are derived from local records on demand and are not persisted.
- Notes are optional and empty or whitespace-only notes are hidden.
- No heavy charting or canvas dependency is introduced.
