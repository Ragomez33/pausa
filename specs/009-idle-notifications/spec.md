# Feature Specification: Smart Idle Notifications

**Feature Branch**: `009-idle-notifications`

**Created**: 2026-10-19

**Status**: Draft

**Input**: User description: "Implementar el sistema de notificaciones push locales en Expo para recordar de manera inteligente al usuario en momentos de inactividad (idle time) si tiene ganas de fumar, antes de encender un cigarrillo por hábito. Configurar permisos al iniciar la app o tras onboarding, canal Android de importancia alta con vibración y sonido. Calcular el intervalo desde daily_cigarettes durante 16 horas despierto y programar/reprogramar una notificación local de inactividad. Cancelar y reprogramar al abrir la app, registrar una posposición o completar un evento de fumar. Título: 'Pausa consciente 🛑'. Cuerpo: '¿Tienes ganas de fumar? Abre la app antes de encenderlo.' Integrar en el montaje inicial. Solo expo-notifications, sin backend ni push remoto."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Receive a Timely Idle Reminder (Priority: P1)

After the person grants notification permission, the app silently schedules one local reminder for the next expected idle moment based on how many cigarettes they usually smoke per day. If they do not interact with the app before then, the reminder invites them to pause and open the app before lighting up.

**Why this priority**: The reminder is the entire feature; without permission, interval calculation, and scheduling, there is nothing to validate.

**Independent Test**: With a profile of 20 cigarettes/day and permission granted, trigger scheduling and verify exactly one pending notification is scheduled about 48 minutes later with the exact required title and body; verify the Android channel has high importance, vibration, and sound.

**Acceptance Scenarios**:

1. **Given** the app has a saved profile and notification permission is granted, **When** the notification service initializes, **Then** one local notification is scheduled for the calculated idle interval.
2. **Given** a profile with 20 daily cigarettes and a 16-hour waking window, **When** the interval is calculated, **Then** it is approximately 48 minutes.
3. **Given** a profile with fewer daily cigarettes, **When** the interval is calculated, **Then** the interval is longer; with more daily cigarettes it is shorter, subject to supported limits.
4. **Given** a scheduled reminder, **Then** its title reads exactly "Pausa consciente 🛑" and its body reads exactly "¿Tienes ganas de fumar? Abre la app antes de encenderlo."
5. **Given** the device is Android, **Then** the reminder uses a high-importance channel with vibration and sound.

---

### User Story 2 - Reset the Idle Timer After Meaningful Activity (Priority: P2)

Whenever the person opens the app, confirms a postponement, or finishes a smoking session, the pending reminder is cancelled and a fresh idle interval begins. The person is not reminded immediately after they have just interacted with their habit.

**Why this priority**: Without reset behavior, reminders become noisy and disconnected from the person's actual activity.

**Independent Test**: Schedule a reminder, then perform each reset trigger separately (open the app, postpone, finish a smoking session) and verify the previous notification is cancelled and exactly one new notification is scheduled for the next interval.

**Acceptance Scenarios**:

1. **Given** a pending reminder, **When** the app opens or returns to the foreground, **Then** the pending reminder is cancelled and one new reminder is scheduled.
2. **Given** a pending reminder, **When** the person confirms a postponement, **Then** the timer resets the same way.
3. **Given** a pending reminder, **When** a smoking session is completed, **Then** the timer resets the same way.
4. **Given** repeated resets in quick succession, **Then** at most one reminder remains pending.
5. **Given** no profile exists, **Then** no reminder is scheduled.

---

### User Story 3 - Handle Permission and Notification Failure Gracefully (Priority: P3)

If the person denies permission or notifications are unavailable, the app continues working normally and explains that reminders are disabled. No duplicate or stale reminders are left behind.

**Why this priority**: Notification support must never block the core smoking-awareness experience.

**Independent Test**: Deny permission and verify no notification is scheduled and the app remains usable; revoke permission after a reminder exists and verify stale reminders are not left pending.

**Acceptance Scenarios**:

1. **Given** notification permission is denied, **When** the app initializes, **Then** no reminder is scheduled and the app remains fully usable.
2. **Given** permission is denied, **Then** the person receives one non-blocking explanation that reminders are disabled.
3. **Given** scheduling fails, **Then** no stale or duplicate reminder is presented as active and the app continues.
4. **Given** permission is granted later, **When** the service initializes or resets again, **Then** scheduling resumes without requiring an app reinstall.

---

### Edge Cases

- What happens when no profile exists? No reminder is scheduled; the app follows the existing onboarding flow.
- What happens when the daily average is zero or missing? The interval falls back to the supported maximum rather than dividing by zero.
- What happens when the calculated interval is extremely short? It is clamped to a sensible minimum so notifications do not become spam.
- What happens when the calculated interval is extremely long? It is clamped to a sensible maximum; the reminder is not lost for days.
- What happens when the app is opened repeatedly? Each reset leaves exactly one pending reminder.
- What happens when a reminder is already pending and a new one is scheduled? The old one is cancelled first.
- What happens when permission is revoked after scheduling? No stale reminder is left presented as active.
- What happens on a non-Android platform? No Android channel is created; the reminder is still scheduled where supported.
- What happens when the device blocks notifications at the OS level? The app continues and explains the disabled state.
- What happens when scheduling is attempted before the database/profile is ready? It waits or no-ops until a profile is available.
- What happens when the person completes a session with no inventory? The session still resets the reminder schedule.
- What happens on app background/foreground transitions? The latest transition resets the timer; only one reminder remains pending.

## Requirements *(mandatory)*

### Functional Requirements

EARS-syntax requirements (per constitution section 4):

- **FR-001** (Event-driven): WHEN the app initializes or onboarding completes, the system shall request notification permission if it has not already been granted.
- **FR-002** (State-driven): WHILE permission is granted and a profile exists, the system shall schedule one local idle reminder.
- **FR-003** (Ubiquitous): The system shall calculate the idle interval from the profile's daily cigarette average across a 16-hour waking window.
- **FR-004** (Ubiquitous): The interval shall be `16 × 60 / dailyCigarettes` minutes, clamped to a minimum of 30 minutes and a maximum of 240 minutes.
- **FR-005** (Ubiquitous): The reminder title shall be exactly "Pausa consciente 🛑".
- **FR-006** (Ubiquitous): The reminder body shall be exactly "¿Tienes ganas de fumar? Abre la app antes de encenderlo."
- **FR-007** (Ubiquitous): On Android, the system shall use a notification channel with high importance, vibration, and sound.
- **FR-008** (Event-driven): WHEN the app opens or returns to the foreground, the system shall cancel the pending idle reminder and schedule a new one.
- **FR-009** (Event-driven): WHEN the person confirms a postponement, the system shall reset the idle reminder.
- **FR-010** (Event-driven): WHEN a smoking session is completed, the system shall reset the idle reminder.
- **FR-011** (Unwanted Behavior): IF permission is denied or unavailable, THEN the system shall not schedule reminders and shall keep the app usable.
- **FR-012** (Unwanted Behavior): IF scheduling fails, THEN the system shall not leave duplicate or stale reminders and shall continue without blocking.
- **FR-013** (State-driven): WHILE no profile exists, the system shall not schedule a reminder.
- **FR-014** (Unwanted Behavior): IF the daily average is zero, negative, or invalid, THEN the system shall use the maximum supported interval instead of dividing by zero.
- **FR-015** (Event-driven): WHEN a new reminder is scheduled, the system shall cancel the previously pending reminder first so at most one remains.
- **FR-016** (Event-driven): WHEN permission is later granted, the system shall resume scheduling on the next initialization or reset without reinstalling.
- **FR-017** (Ubiquitous): The system shall provide one non-blocking explanation when reminders are disabled by permission or availability.
- **FR-018** (Ubiquitous): The system shall perform all notification work locally using the device's notification capability, with no remote push server.
- **FR-019** (Ubiquitous): The idle interval and scheduling shall not block the app's initial render.
- **FR-020** (Event-driven): WHEN the app transitions to the background, the system shall leave exactly one pending reminder for the next idle interval.

### Key Entities *(include if feature involves data)*

- **Notification Permission State**: Whether the person has granted, denied, or not yet been asked for local notification permission.
- **Idle Schedule**: The single pending reminder derived from the daily cigarette average.
  - Calculated interval in minutes
  - Scheduled moment
  - Channel/platform settings
- **Idle Reset Trigger**: An event that restarts the interval.
  - App foreground/open
  - Confirmed postponement
  - Completed smoking session
- **Reminder Content**: Fixed title and body.
- **User Profile** (read-only): provides the daily cigarette average and existence guard.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: For 20 daily cigarettes, the calculated interval is 48 minutes in 100% of tested cases; interval values always stay within 30–240 minutes.
- **SC-002**: With permission granted and a profile present, exactly one reminder is pending after initialization in 100% of tested cases.
- **SC-003**: 100% of reminders use the exact required title and body.
- **SC-004**: Each app-open, postponement, and completed-session reset leaves at most one pending reminder, with 0 duplicates.
- **SC-005**: With permission denied, 0 reminders are scheduled and the app remains fully usable in 100% of tested cases.
- **SC-006**: On Android, the reminder channel uses high importance with vibration and sound in 100% of tested builds.
- **SC-007**: 100% of scheduling occurs locally, with 0 remote push or backend requests.
- **SC-008**: The app's first meaningful screen is not delayed by notification setup, with scheduling under 2 seconds once permission and profile are available.
- **SC-009**: After permission is granted later, reminders resume on the next initialization/reset in 100% of tested cases.

## Clarification Gates

The constitution requires open product decisions to be stated before planning. The following points have recommended defaults and remain open for confirmation before `/speckit.plan`.

1. **Relationship to the existing reminder batch**
   - Context: A previous feature schedules a 24-hour batch of inactivity reminders based on the same daily average.
   - Recommended default: Replace the batch with this single, reset-aware idle reminder to avoid duplicate notifications. Keep the shared interval calculation.
   - Alternative: Keep both (risk of duplicates) or keep the batch and add this as a second mode.

2. **Interval bounds**
   - Context: The request gives a 20/day → ~48-minute example but no guardrails.
   - Recommended default: Clamp to 30–240 minutes. Zero/invalid averages use 240 minutes.
   - Alternative: No maximum, or a user-configurable range.

3. **Reset triggers**
   - Context: The request names app open, postponement, and completed smoking sessions, but says “if the user does not interact with the app”.
   - Recommended default: Reset only on app foreground/open, confirmed postponement, completed session, and background transition; not on every tap or screen change.
   - Alternative: Reset on any interaction, which would suppress reminders during active use but is harder to define consistently.

## Assumptions

- The app remains local-first; only device-local notifications are used.
- Permission is requested once at startup or after onboarding; denial does not block app use.
- The 16-hour waking window is fixed for this feature.
- The daily cigarette average comes from the saved profile; no network lookup is involved.
- Only one idle reminder may be pending at a time.
- Android uses a high-importance channel with vibration and sound; other platforms use the default presentation settings.
- Scheduling is attempted only after the profile/database is ready.
- The previous batch reminder behavior is replaced by this single reset-aware reminder (subject to the clarification gate).
- Notification setup runs asynchronously and never blocks initial rendering.
- No remote push infrastructure, FCM/APNs backend, or external server is introduced.
