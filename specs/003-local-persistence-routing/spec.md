# Feature Specification: Local Persistence & Startup Routing

**Feature Branch**: `003-local-persistence-routing`

**Created**: 2026-10-19

**Status**: Draft

**Input**: User description: "Configurar la capa de persistencia local usando Drizzle ORM y Expo SQLite, e integrar la lógica de verificación de perfil y enrutamiento inicial. Crear src/db/schema.ts con user_profile y pause_events, src/db/client.ts con pausa.db, el hook useDatabaseInitialized con ready/hasProfile/error, integrar el layout con indicador de carga y redirección a /onboarding, y persistir el onboarding validando datos numéricos e insertando en user_profile antes de redirigir a /."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - First-Run Setup Persists the Profile (Priority: P1)

A person opens Pausa for the first time. The app prepares its on-device data storage, detects that no profile exists, and takes the person to the onboarding screen. The person enters how many cigarettes they smoke per day, the cost of a pack, their currency, and their quit goal. After submitting valid values, the app saves the profile locally and opens the home screen.

**Why this priority**: Without a persisted profile there is no personalization, no meaningful metrics, and no reason for the rest of the product to exist. This is the minimum viable slice.

**Independent Test**: Start with an empty device state, launch the app, complete onboarding with valid values, confirm the home screen opens, then close and relaunch the app and confirm the profile is still recognized and onboarding is skipped.

**Acceptance Scenarios**:

1. **Given** no profile is stored on the device, **When** the app finishes preparing storage, **Then** the onboarding screen is shown.
2. **Given** the onboarding form, **When** the person submits empty, non-numeric, zero, or negative numeric values for required fields, **Then** saving is blocked and a clear message is shown.
3. **Given** valid onboarding values, **When** the person submits the form, **Then** exactly one profile is saved locally and the home screen is shown.
4. **Given** a saved profile, **When** the person closes and reopens the app, **Then** the home screen is shown directly and the same profile data is available.

---

### User Story 2 - Returning Users Go Straight to Home (Priority: P2)

A returning user opens Pausa. While the app prepares local storage, a loading indicator is shown. As soon as storage is ready and a profile is found, the app routes the person to the home screen without showing onboarding.

**Why this priority**: Returning users are the daily audience. Sending them through setup again would be confusing and would make the app feel broken.

**Independent Test**: With a profile already stored, launch the app and confirm the loading indicator appears only while preparation is in progress and the home screen opens without onboarding.

**Acceptance Scenarios**:

1. **Given** a stored profile, **When** the app launches, **Then** a loading indicator is shown while local storage is being prepared.
2. **Given** storage is ready and a profile exists, **When** the app completes startup, **Then** the home screen is shown and onboarding is not displayed.
3. **Given** the onboarding screen is opened while a profile already exists, **When** the person submits again, **Then** no duplicate profile is created.

---

### User Story 3 - Pause Events Are Stored Alongside the Profile (Priority: P3)

When the person records a pause attempt, the event is saved locally with its moment in time, the emotion that triggered the urge, whether the person resisted, and optional notes. This data stays on the device and remains available after relaunching the app.

**Why this priority**: Pause events are the core behavioral record, but they depend on the profile and startup flow already working.

**Independent Test**: With a profile present, record a pause event, relaunch the app, and confirm the event is still available with all captured fields.

**Acceptance Scenarios**:

1. **Given** prepared local storage, **When** a pause event is saved, **Then** it retains its timestamp, trigger emotion, resisted outcome, and optional notes.
2. **Given** saved pause events, **When** the app is reopened, **Then** the events remain available.
3. **Given** a pause event without notes, **When** it is saved, **Then** the optional notes field may be empty without preventing the save.

---

### Edge Cases

- What happens when local storage fails to prepare? The app MUST show a clear, user-visible error instead of an empty or misleading screen.
- What happens when the device has no profile and the person closes the app midway through onboarding? No partial profile may be saved, and the next launch MUST return to onboarding.
- What happens when the person taps submit repeatedly? Only one profile may be stored.
- What happens when storage preparation is slow? The app MUST keep the loading indicator responsive and MUST NOT render profile-dependent content before the result is known.
- What happens when previously stored data exists from an older app version? The app MUST avoid duplicating or silently discarding that data (see Clarification Gates).
- What happens when pack cost is zero? The profile may still be valid as long as the value is numeric and not negative.
- What happens when the quit goal is empty? The profile can still be saved if all required fields are valid, using a sensible default for the goal.

## Requirements *(mandatory)*

### Functional Requirements

EARS-syntax requirements (per constitution section 4):

- **FR-001** (Ubiquitous): The system shall persist user profile and pause-event data exclusively in local on-device storage.
- **FR-002** (Ubiquitous): The system shall store a user profile containing daily cigarette count, pack cost, currency, quit goal, and creation timestamp.
- **FR-003** (Ubiquitous): The system shall store each pause event with its timestamp, trigger emotion, resisted outcome, and optional notes.
- **FR-004** (Event-driven): WHEN the app launches, the system shall prepare the local data storage before presenting profile-dependent content.
- **FR-005** (Event-driven): WHEN storage preparation finishes, the system shall determine whether at least one user profile exists.
- **FR-006** (State-driven): WHILE local storage is being prepared, the system shall display a loading indicator.
- **FR-007** (Event-driven): WHEN storage is ready and no profile exists, the system shall route the person to the onboarding screen.
- **FR-008** (Event-driven): WHEN storage is ready and a profile exists, the system shall route the person to the home screen.
- **FR-009** (Event-driven): WHEN the onboarding form is submitted, the system shall validate that daily cigarette count and pack cost are numeric and within accepted ranges.
- **FR-010** (Event-driven): WHEN onboarding data is valid, the system shall save exactly one user profile and then route the person to the home screen.
- **FR-011** (Unwanted Behavior): IF a required numeric onboarding value is empty, non-numeric, zero, or negative, THEN the system shall block the save and communicate the validation error without inline field error text.
- **FR-012** (Unwanted Behavior): IF local storage cannot be prepared, read, or written, THEN the system shall surface a clear, user-visible error and shall not silently discard data.
- **FR-013** (Unwanted Behavior): IF a profile already exists, THEN the system shall not create a duplicate profile when onboarding is submitted again.
- **FR-014** (State-driven): WHILE no profile exists, the system shall prevent access to profile-dependent home content and route to onboarding.
- **FR-015** (Ubiquitous): The system shall keep all stored profile and pause-event information on the device without network synchronization.
- **FR-016** (Ubiquitous): The system shall complete storage preparation without blocking screen rendering, so the loading indicator remains responsive.
- **FR-017** (Event-driven): WHEN the person completes onboarding, the system shall record the creation moment of the profile.
- **FR-018** (Optional Feature): WHERE the person provides a quit goal, the system shall store and make it available with the profile.

### Key Entities *(include if feature involves data)*

- **User Profile**: The person's baseline smoking configuration and motivation.
  - Daily cigarette count (positive integer)
  - Pack cost (non-negative decimal)
  - Currency (short text code)
  - Quit goal / personal motivation (free text, required)
  - Creation timestamp (ISO date-time text)
- **Pause Event**: A single recorded urge episode.
  - Event timestamp (ISO date-time text)
  - Trigger emotion (short text, e.g. anxiety, work stress, coffee/social, boredom)
  - Resisted (true/false outcome)
  - Notes (optional free text)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of first-time launches with no stored profile reach onboarding after storage preparation, with 0 launches showing profile-dependent home content first.
- **SC-002**: 100% of returning launches with a stored profile reach home without showing onboarding, with 0 false redirects to onboarding.
- **SC-003**: 100% of invalid numeric onboarding submissions are blocked, with 0 profiles saved containing invalid values.
- **SC-004**: After a successful onboarding, closing and reopening the app preserves the profile in 100% of tested relaunches.
- **SC-005**: A profile is stored exactly once per onboarding completion, with 0 duplicate profile records.
- **SC-006**: The app shows a loading indicator throughout storage preparation and presents the first actionable screen within 2 seconds on a typical device.
- **SC-007**: When storage preparation fails, 100% of tested launches show a clear error state, with 0 silent failures.
- **SC-008**: 100% of stored profile and pause-event records remain available after an app restart, with 0 records sent off the device.

## Clarification Gates

The constitution requires open technical/product questions to be stated before planning. The following points have recommended defaults; they remain open for confirmation before `/speckit.plan`.

1. **Existing installed data (data continuity)**
   - Context: The project already contains local profile and pause-event records under the existing storage layer, whose field shapes differ from the requested shape (for example, integer timestamps and a nullable quit goal versus ISO text timestamps and a required quit goal).
   - Recommended default: Preserve existing records where possible and avoid destructive resets; treat fresh installs as the primary path and document any compatibility handling in the plan.
   - Alternative: Start from a clean database and discard previously stored local records.

2. **Single-profile policy**
   - Context: The onboarding route remains reachable even when a profile exists.
   - Recommended default: At most one profile record; a new onboarding submission when a profile exists must not create a duplicate.
   - Alternative: Allow multiple profiles as historical records.

3. **Ownership of the persistence layer location**
   - Context: The request designates `src/db/` as the home of the persistence layer, while the current implementation lives under `src/shared/db/`.
   - Recommended default: Consolidate on `src/db/` and update consumers to import from there, removing the old location only after all imports are migrated.
   - Alternative: Keep `src/shared/db/` and treat the requested path as a re-export facade.

## Assumptions

- The app targets mobile (iOS/Android) with a local-first architecture; profile and pause-event data never leave the device in this feature.
- "Profile exists" means at least one user profile record is present.
- The onboarding form collects daily cigarettes, pack cost, currency, and quit goal; currency has a sensible default when unspecified, and a default goal is applied when left empty, per the requested non-null schema.
- Daily cigarette count must be a positive integer; pack cost must be a numeric value greater than or equal to zero.
- The home screen is the route reached at `/`; onboarding is reached at `/onboarding`.
- A loading indicator is shown for the whole storage-preparation period rather than rendering a partially interactive app.
- Existing pause-event capture and dashboard features continue to consume the same underlying records; this feature changes where and how they are stored, not what they mean.
- The required on-device storage capabilities are already available in the project; no new runtime libraries are introduced.
