# Feature Specification: Onboarding & Pause Button Flow

**Feature Branch**: `002-onboarding-pause-flow`

**Created**: 2026-10-18

**Status**: Draft

**Input**: User description: "Build the initial profile-setup screens (Onboarding) and the main mindfulness action screen (Pausa), backed by local on-device storage, using React Native, Expo Router and NativeWind. Includes local profile + pause-event persistence, onboarding wizard with validation, home dashboard with dynamic metrics and a central Pausa button, and a pause flow with reflection timer and trigger selection."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - First-Run Onboarding Creates the Profile (Priority: P1)

A new user opens Pausa for the first time. Because no profile exists yet, the app presents a guided setup where they enter their current daily cigarette count, the cost of a pack, their preferred currency, and their personal quit goal/motivation. Required and numeric fields are validated before they can finish. On completion the profile is saved locally and the user lands on the home screen.

**Why this priority**: Nothing else in the app can function without a user profile; this is the entry gate and the MVP slice.

**Independent Test**: Launch with no stored profile → complete the setup with valid values → confirm the profile is persisted locally and the user is taken to home; relaunch and confirm onboarding is skipped.

**Acceptance Scenarios**:

1. **Given** no profile exists, **When** the app launches, **Then** the user is taken to the onboarding flow.
2. **Given** the onboarding form, **When** the user submits empty or non-numeric values for required numeric fields, **Then** the flow blocks advancement and communicates the validation error without inline field error text.
3. **Given** valid onboarding data, **When** the user completes the flow, **Then** the profile is stored locally exactly once and the user is redirected to the home screen.
4. **Given** a stored profile, **When** onboarding is opened again, **Then** the user can still proceed and the home screen remains reachable.

---

### User Story 2 - Home Dashboard with Dynamic Metrics and Pausa Button (Priority: P2)

A returning user opens the app and lands on the home screen, which shows a prominent central "Pausa" button and quick local metrics: estimated money saved based on elapsed time and profile data, and the count/streak of successful pauses. All metrics are computed from real stored records, never hardcoded.

**Why this priority**: The home screen is the daily touchpoint and the launch point of the core action; it delivers immediate value once a profile exists.

**Independent Test**: With a stored profile and some recorded pause events, open home and confirm the metrics reflect the actual stored data; change the underlying records and confirm the values update.

**Acceptance Scenarios**:

1. **Given** no profile exists, **When** the home screen is opened, **Then** the user is redirected to onboarding.
2. **Given** a stored profile, **When** the home screen renders, **Then** it shows the central Pausa button and metrics derived from stored profile and pause events.
3. **Given** zero recorded pause events, **When** the home screen renders, **Then** metrics display a valid zero/empty state without crashing.
4. **Given** the home screen, **When** the user taps the Pausa button, **Then** the pause flow opens.

---

### User Story 3 - Record an Impulse Through the Pause Flow (Priority: P3)

When an urge to smoke hits, the user taps Pausa. A short reflection timer (a breathing/awareness pause of roughly 10–30 seconds) interrupts the automatic habit loop. The user then selects the emotional trigger (e.g. anxiety, work stress, coffee/social, boredom) and records the outcome: "I managed to pause" (resisted) or "I gave in" (ceded). The event is saved locally, and the user returns home with updated metrics.

**Why this priority**: This is the core behavior-change mechanic; it depends on the profile and home screen being in place.

**Independent Test**: From home, start the pause flow, watch the reflection timer complete, pick a trigger, choose an outcome, and confirm a pause event is stored locally and reflected in the home metrics.

**Acceptance Scenarios**:

1. **Given** the pause flow is open, **When** it starts, **Then** a reflection timer runs for the configured duration before the outcome controls are available.
2. **Given** the reflection timer completed, **When** the user selects a trigger and confirms "resisted" or "ceded", **Then** a pause event with that trigger and outcome is stored locally.
3. **Given** a stored pause event, **When** the user returns to home, **Then** the success/streak metrics reflect the new event.
4. **Given** the reflection timer is running, **When** the user leaves the flow, **Then** no partial or invalid event is persisted.

---

### Edge Cases

- What happens if the reflection timer is interrupted or the app is backgrounded mid-flow? The flow MUST recover to a valid state and MUST NOT persist an incomplete event.
- What happens if the user enters a very large or zero value for daily cigarettes or pack cost? The system MUST reject non-positive/non-numeric values with a clear message and MUST handle a zero-cost profile without division errors.
- What happens when currency is not specified? A sensible default MUST be applied and shown.
- What happens when an emotional trigger is not selected? The system MUST require a trigger before recording the outcome, or record an explicit "unspecified" trigger.
- What happens if local storage is unavailable? The system MUST surface a clear error instead of silently discarding the user's data.

## Requirements *(mandatory)*

### Functional Requirements

EARS-syntax requirements (per constitution section 4):

- **FR-001** (Ubiquitous): The system shall provide a first-run onboarding flow that captures a user profile.
- **FR-002** (Ubiquitous): The system shall persist all profile and pause-event data exclusively in local on-device storage for this module.
- **FR-003** (Ubiquitous): The home screen shall present a prominent central "Pausa" action and quick metrics derived from stored records.
- **FR-004** (Event-driven): WHEN the app launches, the system shall determine profile existence and route to onboarding or home accordingly.
- **FR-005** (Event-driven): WHEN the user completes onboarding with valid data, the system shall store the profile and redirect to the home screen.
- **FR-006** (Event-driven): WHEN the user activates the Pausa action, the system shall start a reflection timer before allowing outcome capture.
- **FR-007** (Event-driven): WHEN the user confirms an outcome, the system shall store a pause event containing the timestamp, selected trigger, and resisted/ceded result.
- **FR-008** (State-driven): WHILE the reflection timer is running, the system shall prevent recording an outcome.
- **FR-009** (State-driven): WHILE no profile exists, the system shall block access to the home metrics and redirect to onboarding.
- **FR-010** (Unwanted Behavior): IF required numeric onboarding fields are empty or non-numeric, THEN the system shall block advancement and communicate the validation error through the centralized notification mechanism (no inline field error text).
- **FR-011** (Unwanted Behavior): IF the reflection timer is interrupted, THEN the system shall NOT persist an incomplete pause event.
- **FR-012** (Unwanted Behavior): IF local storage cannot be read or written, THEN the system shall surface a clear, user-visible error.
- **FR-013** (Optional Feature): WHERE the user provides a quit goal/motivation, the system shall store and make it available on the profile.
- **FR-014** (Ubiquitous): The home metrics shall be computed dynamically from stored data and shall never be hardcoded.

### Key Entities *(include if feature involves data)*

- **User Profile**: The user's baseline configuration and motivation.
  - Daily cigarette count (positive integer)
  - Pack cost (non-negative decimal)
  - Currency (short text code; default applied when unspecified)
  - Quit goal / personal motivation (free text, optional)
  - Creation timestamp
- **Pause Event**: A single recorded urge episode.
  - Event timestamp
  - Trigger emotion (e.g. anxiety, work stress, coffee/social, boredom)
  - Outcome: resisted (true) or ceded (false)
  - Notes (optional free text)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time user can complete onboarding and reach the home screen in under 90 seconds.
- **SC-002**: 100% of invalid or missing required onboarding values are blocked before submission, with 0 cases of a profile saved with invalid data.
- **SC-003**: After recording a pause event, the home metrics reflect the change within one screen refresh, with 0 hardcoded metric values.
- **SC-004**: The pause flow reliably captures an outcome after the reflection timer, with 0 incomplete events persisted when the flow is interrupted.
- **SC-005**: A returning user is never shown onboarding and always lands on home when a profile exists (0 false redirects to onboarding).

## Assumptions

- The app targets mobile (iOS/Android) with a local-first architecture; there is no network/synchronization in this module.
- Onboarding is a single guided flow; it may be a multi-step wizard or a single clean form — the user experience requirement is validation-gated completion, not a specific step count.
- The reflection timer duration is configurable within a short range (roughly 10–30 seconds); a default in that range is used when unspecified.
- Trigger options are a fixed short list (anxiety, work stress, coffee/social, boredom) and may include an explicit "other/unspecified" option.
- Money saved is an estimate derived from the elapsed time since a reference point and the user's pack cost/daily consumption; it is indicative, not financial advice.
- "Streak" refers to consecutive successful (resisted) pauses or days without ceding, per a single consistent definition chosen in planning.
- UI is built from native components styled with utility classes, with a coherent dark palette (deep slate/zinc backgrounds, clean accents).
