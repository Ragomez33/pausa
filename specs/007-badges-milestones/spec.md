# Feature Specification: Badges & Milestones

**Feature Branch**: `007-badges-milestones`

**Created**: 2026-10-19

**Status**: Draft

**Input**: User description: "Implementar el módulo de Logros y Hitos (Milestones/Badges) locales para motivar al usuario en su proceso de cesación. Agregar user_badges con badge_key único y unlocked_at ISO. Definir un catálogo estático de logros con títulos, descripciones y condiciones basadas en tiempo, pausas exitosas o dinero ahorrado. Pantalla que cruce user_badges con el catálogo para mostrar desbloqueados y bloqueados con progreso o grisáceos. Verificación automática al abrir Home o registrar una pausa; insertar logros cumplidos que aún no estén registrados, mediante persistencia local. UI limpia y minimalista con NativeWind."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See Achievements and Progress (Priority: P1)

A person opens the achievements screen and sees every available milestone in the app. Unlocked badges show when they were earned; locked badges appear muted with a progress bar showing how close the person is to earning them.

**Why this priority**: The visible collection and progress are the motivational core of the feature. Without it, automatic unlocking has nothing to show.

**Independent Test**: Seed a profile and known activity, open the achievements screen, and verify every catalog badge appears exactly once with the correct unlocked/locked state, unlock timestamp when applicable, and progress value.

**Acceptance Scenarios**:

1. **Given** the achievements screen and no unlocked badges, **When** it opens, **Then** all catalog badges appear locked with their titles, descriptions, and progress indicators.
2. **Given** a previously unlocked badge, **When** the screen opens, **Then** that badge appears unlocked with its unlock date and no progress bar.
3. **Given** a locked badge whose condition is partially met, **When** it renders, **Then** it shows a progress bar and a readable progress value.
4. **Given** a badge condition already met before this feature existed, **When** the screen or Home is opened, **Then** the badge becomes unlocked on that evaluation and remains unlocked afterward.

---

### User Story 2 - Unlock Milestones Automatically (Priority: P2)

As the person uses the app, milestones unlock automatically when their conditions are met. They do not have to claim or manually refresh anything.

**Why this priority**: Automatic recognition is what makes milestones feel like a reward rather than a chore.

**Independent Test**: Start with no unlocked badges, perform activity that meets several conditions, then open Home and confirm the eligible badges are stored exactly once with unlock timestamps; repeat the evaluation and confirm no duplicates.

**Acceptance Scenarios**:

1. **Given** the first resisted pause exists, **When** badges are evaluated, **Then** the first-pause milestone unlocks.
2. **Given** at least five resisted pauses, **When** badges are evaluated, **Then** the five-pause milestone unlocks.
3. **Given** the active streak reaches one day, one week, or one month, **When** badges are evaluated, **Then** the corresponding time milestone unlocks.
4. **Given** estimated savings reach the money milestone threshold, **When** badges are evaluated, **Then** the savings milestone unlocks.
5. **Given** a badge is already unlocked, **When** evaluation runs again, **Then** no duplicate record is created and the original unlock time is preserved.
6. **Given** evaluation runs with no eligible locked badges, **Then** nothing is written.

---

### User Story 3 - Recognize New Achievements (Priority: P3)

When one or more badges unlock during an evaluation, the person receives clear, lightweight feedback so the achievement does not go unnoticed.

**Why this priority**: Feedback closes the motivation loop, but the feature still delivers value through the collection and automatic unlocking alone.

**Independent Test**: Trigger an unlock from Home and from saving a pause; confirm a single visible recognition appears for the newly unlocked badge(s) and that revisiting without new unlocks does not repeat it.

**Acceptance Scenarios**:

1. **Given** one or more newly unlocked badges, **When** evaluation completes, **Then** the person sees a clear confirmation naming the achievement(s).
2. **Given** no new unlocks, **When** evaluation completes, **Then** no unlock confirmation is shown.
3. **Given** multiple badges unlock at once, **When** the confirmation appears, **Then** all newly unlocked achievements are represented without blocking navigation.

---

### Edge Cases

- What happens when no profile exists? The person MUST be routed to onboarding and badge evaluation MUST not run.
- What happens when the person has no activity yet? All badges are locked with zero progress; the screen remains usable.
- What happens when a streak resets after a badge was earned? The unlocked badge MUST remain unlocked permanently.
- What happens when the same badge condition is met repeatedly? Only one record may exist per badge.
- What happens when a badge key exists in storage but not in the current catalog? It MUST be ignored gracefully and MUST NOT break the screen.
- What happens when progress exceeds the target? Progress is capped at 100%.
- What happens when the device clock is behind a stored timestamp? Elapsed-time progress MUST never be negative.
- What happens when local storage fails during evaluation? No partial unlock set may be presented; a clear error is surfaced and existing unlocked badges remain intact.
- What happens when evaluation is triggered twice quickly? It MUST remain idempotent.
- What happens when currency is invalid for the savings badge? Progress still computes numerically; display falls back to a readable currency label.

## Requirements *(mandatory)*

### Functional Requirements

EARS-syntax requirements (per constitution section 4):

- **FR-001** (Ubiquitous): The system shall maintain a local record for each unlocked milestone containing its unique key and the exact unlock moment.
- **FR-002** (Ubiquitous): The system shall ensure at most one record exists per milestone key.
- **FR-003** (Ubiquitous): The system shall define a static catalog of available milestones with a key, title, description, condition, and progress target.
- **FR-004** (Ubiquitous): The catalog shall include milestones based on the first resisted pause, a count of resisted pauses, streak duration of one day, one week, and one month, and a savings threshold.
- **FR-005** (Event-driven): WHEN the achievements screen opens, the system shall show every catalog milestone exactly once.
- **FR-006** (Ubiquitous): The system shall visually distinguish unlocked milestones from locked ones.
- **FR-007** (Event-driven): WHEN a milestone is unlocked, the screen shall show its unlock date.
- **FR-008** (State-driven): WHILE a milestone is locked, the system shall show progress toward its condition, capped at 100% and never negative.
- **FR-009** (Event-driven): WHEN Home opens, the system shall evaluate milestone conditions against the current local state.
- **FR-010** (Event-driven): WHEN a pause event is saved, the system shall evaluate milestone conditions.
- **FR-011** (Event-driven): WHEN the achievements screen opens, the system shall evaluate milestone conditions before rendering the final states.
- **FR-012** (Event-driven): WHEN a condition is met for a milestone that is not yet stored, the system shall persist its unlock moment immediately.
- **FR-013** (State-driven): WHILE a milestone is already stored, the system shall not create a duplicate or change its original unlock moment.
- **FR-014** (Event-driven): WHEN an existing user already meets conditions, the system shall unlock those milestones on the next evaluation.
- **FR-015** (Event-driven): WHEN one or more milestones unlock during an evaluation, the system shall show a lightweight confirmation naming them.
- **FR-016** (State-driven): WHILE no new milestone unlocks, the system shall not repeat a confirmation.
- **FR-017** (Ubiquitous): The system shall never remove an unlocked milestone because the current streak or metrics later decrease.
- **FR-018** (Unwanted Behavior): IF no profile exists, THEN the system shall not evaluate badges and shall route the person to onboarding.
- **FR-019** (Unwanted Behavior): IF local storage fails during evaluation, THEN the system shall not present a partial unlock set and shall show a clear error.
- **FR-020** (Unwanted Behavior): IF evaluation runs repeatedly or concurrently, THEN it shall remain idempotent.
- **FR-021** (Ubiquitous): The milestone catalog and unlocked records shall remain on the device with no network calls or remote synchronization.
- **FR-022** (Ubiquitous): The achievements interface shall stay clean and minimal, using utility-styled native components without heavy graphic dependencies.

### Key Entities *(include if feature involves data)*

- **Milestone Definition** (static, not persisted):
  - Key (for example `first_pause`, `1_day_clean`, `1_week_clean`, `money_saver_10`)
  - Title and short description
  - Condition type and target (resisted pauses, streak duration, or savings amount)
  - Progress unit and display format
- **Unlocked Milestone** (persisted):
  - Unique milestone key
  - Exact unlock moment (ISO date-time)
- **Evaluation State** (derived):
  - Current streak duration
  - Total resisted pauses
  - Estimated money saved
  - Per-milestone progress value and percentage
  - Newly unlocked milestones for the current evaluation

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of unlocked milestone records correspond to a condition that was met, with 0 false unlocks.
- **SC-002**: 0 duplicate records exist per milestone key across repeated evaluations.
- **SC-003**: A returning user who already meets conditions sees those milestones unlocked after one evaluation in 100% of tested cases.
- **SC-004**: The achievements screen displays every catalog milestone exactly once in 100% of tested cases, with correct locked/unlocked states.
- **SC-005**: Progress values match a manual calculation in 100% of tested cases and are always between 0% and 100%.
- **SC-006**: Newly unlocked milestones produce a visible confirmation in 100% of unlock events, and 0 confirmations appear when nothing unlocks.
- **SC-007**: Unlocked milestones remain unlocked after a streak reset or metric decrease in 100% of tested cases.
- **SC-008**: All evaluation and persistence remain local, with 0 network requests.
- **SC-009**: The achievements screen opens with final states within 2 seconds on a typical device.

## Clarification Gates

The constitution requires open product decisions to be stated before planning. The following points have recommended defaults and remain open for confirmation before `/speckit.plan`.

1. **Milestone catalog contents**
   - Context: The request gives example keys but does not define the complete list.
   - Recommended default: Six milestones — first resisted pause, five resisted pauses, 1-day streak, 1-week streak, 1-month streak, and savings of 10 units of the profile currency.
   - Alternative: A larger catalog with additional pause-count and savings tiers.

2. **Evaluation moments**
   - Context: The request says “cada vez que se abra el Home o se registre una nueva pausa”; the achievements screen also needs accurate states.
   - Recommended default: Evaluate on Home focus, immediately after a pause is saved, and before rendering the achievements screen.
   - Alternative: Only on app launch and manual refresh.

3. **Unlock feedback**
   - Context: The request asks for motivation but does not specify how newly unlocked badges are announced.
   - Recommended default: Show a lightweight toast/banner naming newly unlocked badges; show nothing when no badge unlocks.
   - Alternative: Silent unlock (visible only in the collection) or a blocking modal.

## Assumptions

- The app remains local-first; badge data never leaves the device.
- The milestone catalog is static in the app and only unlocked records are persisted.
- Unlock is permanent; later streak resets or lower metrics never revoke a badge.
- Time-based milestones use the same active-streak definition as the Home and History screens: profile creation or the most recent ceded pause event.
- Savings milestones use the same estimated money-saved calculation as the Home screen.
- The savings threshold is 10 units in the profile currency; missing/invalid currency does not block numeric progress.
- Existing users receive retroactive unlocks on their first evaluation.
- Evaluation is idempotent and safe to run on every Home focus.
- Newly unlocked badges are announced once per unlock event, not on every screen visit.
- Badges with unknown keys in storage are ignored rather than shown as catalog entries.
- The achievements screen is reachable from Home as a dedicated screen.
- No heavy graphic or animation dependency is introduced.
