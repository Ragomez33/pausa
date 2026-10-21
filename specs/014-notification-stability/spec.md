# Feature Specification: Notification Stability and Robustness

**Feature Branch**: `014-notification-stability`
**Created**: 2026-10-21
**Status**: Implemented
**Input**: Corrective plan after diagnosing (1) session prompts batched at ~30 minutes by Android Doze because exact-alarm access was not granted, and (2) idle reminders being cancelled/restarted on every foreground plus permanent suspension caused by orphan active sessions.

## Relationship to Previous Features

This feature amends:

- `specs/008-awareness-loop-smoking` — session prompts (`smoking-session:` prefix, 12 prompts every 5 minutes).
- `specs/009-idle-notifications` — idle reminder lifecycle, trigger anchoring and reset rules.

It introduces no schema change, no remote push, and no new route.

## User Scenarios & Testing

### User Story 1 — Session prompts arrive on time or are surfaced in-app (P1)

While a smoking session is active, the person should receive the 5-minute prompts as close to their boundary as the OS allows. When Android defers, batches, or drops those alarms, returning to the app must surface the most recent missed boundary in a clean in-app card and re-synchronize the remaining OS prompts.

**Independent Test**: Start a session, lock the device for 31 minutes, then reopen the app. The elapsed timer must show the real elapsed time, one in-app card must announce the latest 5-minute boundary (e.g. 30), and the remaining future prompts must be scheduled again.

**Acceptance Scenarios**:

1. **Given** an active session, **When** the app returns to the foreground, **Then** the elapsed timer is recomputed immediately from `startedAtMs`.
2. **Given** at least one 5-minute boundary passed while backgrounded, **When** the app returns to the foreground, **Then** one in-app card announces the latest crossed boundary and can be dismissed.
3. **Given** an active session, **When** the app returns to the foreground, **Then** remaining future prompts are re-scheduled (already-passed boundaries are skipped).
4. **Given** Android 12+ with "Alarms & reminders" not granted, **When** reminders are first scheduled and permission is granted, **Then** one informational message per installation tells the person where to enable exact alarms.

---

### User Story 2 — Idle reminder survives frequent app usage (P1)

The idle reminder must be anchored to the last real habit interaction (smoking event or postponed pause), not to the last time the app was opened. Opening or backgrounding the app must not silently postpone the reminder forever.

**Independent Test**: With a 20/day profile (48-minute interval), postpone a craving at T. Open the app at T+10, T+20 and T+30 minutes without recording habit activity. The reminder must still target T+48 minutes until the person leaves the app, at which point exactly one reminder is pending for the remaining time.

**Acceptance Scenarios**:

1. **Given** a pending idle reminder and no active session, **When** the app becomes active, **Then** an existing pending reminder is left untouched.
2. **Given** no pending idle reminder (missed or delivered) and no active session, **When** the app becomes active, **Then** a new reminder is scheduled from the last real interaction, or from now when that target already passed.
3. **Given** the app transitions to background, **When** no session is active, **Then** the reminder is cancelled and re-scheduled anchored to the last real interaction.
4. **Given** a postponement or a recorded session, **When** it succeeds, **Then** the reminder is anchored to that new interaction.
5. **Given** an active smoking session, **When** the lifecycle is evaluated, **Then** no idle reminder remains pending.

---

### User Story 3 — Orphan sessions no longer block reminders (P2)

If the process dies while a session is open, the persisted `active_smoking_session` row must be released on the next cold start when it is stale, so the idle reminder is not suspended forever.

**Independent Test**: Insert an `active_smoking_session` row with `started_at_ms` 45 minutes in the past, force-stop the app, relaunch. The row must be gone, any `smoking-session:` prompts cancelled, and an idle reminder must be scheduled.

**Acceptance Scenarios**:

1. **Given** an active session older than the orphan threshold at cold start, **When** the app becomes ready, **Then** the row is deleted and its session notifications are cancelled.
2. **Given** a recent active session at cold start, **Then** it is preserved and idle reminders stay suspended.
3. **Given** invalid, future, or non-finite `started_at_ms`, **Then** the session is treated as orphaned.

---

### Edge Cases

- Android versions below 12 or non-Android platforms: no exact-alarm guidance.
- The exact-alarm hint is shown at most once per installation (persisted key). It is not shown when notification permission is denied.
- A reminder received while the app is in the foreground: the next `active`/`background` transition re-arms it; the app does not schedule duplicates.
- The reminder fires while the app is closed and the person never reopens it: no automatic repeat is possible without a repeating trigger, which cannot be anchored to the last interaction. Documented in `research.md` (R3).
- Long legitimate session (>30 minutes): anchored prompts stop at 60 minutes; the stale-session UI remains the source of truth for closing.
- Cold start exactly at the orphan threshold: treated as orphaned.

## Requirements (EARS)

### Exact alarms

- **FR-001** (Ubiquitous): On Android 12+ the system shall expose an exact-alarm guidance check based on the OS API level.
- **FR-002** (Event-driven): WHEN reminders are scheduled successfully and the exact-alarm hint has not been shown for this installation, the system shall show one non-blocking message explaining how to enable "Alarms & reminders".
- **FR-003** (Unwanted Behavior): IF notification permission is denied, THEN the system shall not show the exact-alarm message.

### Idle reminder

- **FR-004** (Ubiquitous): The next idle reminder shall be computed as `lastRealInteractionAt + clamp(16 × 60 / dailyCigarettes, 30, 240) minutes`.
- **FR-005** (Unwanted Behavior): IF that target is already in the past, THEN the system shall schedule a full new interval from now.
- **FR-006** (Event-driven): WHEN the app becomes active and a valid reminder is already pending, the system shall leave it unchanged.
- **FR-007** (Event-driven): WHEN the app becomes active without a pending reminder, the system shall schedule one anchored to the last real interaction.
- **FR-008** (Event-driven): WHEN the app becomes background, the system shall cancel and schedule one reminder anchored to the last real interaction.
- **FR-009** (Event-driven): WHEN a postponement or session is recorded successfully, the system shall re-anchor the reminder to that interaction.
- **FR-010** (State-driven): WHILE a non-orphan active smoking session exists, the system shall cancel idle reminders and shall not schedule new ones.
- **FR-011** (Ubiquitous): The idle notification shall carry `data.type = "idle-reminder"` for future deep-linking.
- **FR-012** (Ubiquitous): The exact title and body from feature 009 shall remain unchanged.

### Orphan sessions

- **FR-013** (Event-driven): WHEN the app becomes ready at cold start and the active session started at least 30 minutes ago, the system shall delete the row.
- **FR-014** (Event-driven): WHEN an orphan session is deleted, the system shall cancel pending `smoking-session:` notifications.
- **FR-015** (Unwanted Behavior): IF the stored `started_at_ms` is invalid, non-finite, or in the future, THEN the session shall be treated as orphaned.

### Foreground fallback

- **FR-016** (Event-driven): WHEN the app returns to the foreground during an active session, the system shall recompute the elapsed time from `startedAtMs`.
- **FR-017** (Event-driven): WHEN one or more 5-minute boundaries were crossed since the last announced one, the system shall surface the latest crossed boundary in a dismissible in-app card.
- **FR-018** (Event-driven): WHEN the app returns to the foreground during an active session, the system shall re-schedule remaining session prompts.
- **FR-019** (Ubiquitous): The foreground fallback shall cap announced boundaries at 60 minutes.
- **FR-020** (Ubiquitous): All work shall remain local; no remote push, FCM, APNs, or backend scheduling.

## Key Entities

- **Idle Anchor**: maximum timestamp among smoking events and pause events, in milliseconds.
- **Idle Target**: anchor + clamped interval; never in the past when scheduled.
- **Orphan Session**: `active_smoking_session` row whose start is at least 30 minutes old, invalid, or in the future.
- **Foreground Prompt Boundary**: last multiple of 5 minutes elapsed, capped at 60.
- **Exact Alarm Guidance Flag**: persisted `sync_state` key `notification_exact_alarm_hint_shown`.

## Success Criteria

- **SC-001**: For a 20/day profile, opening the app repeatedly does not change the idle target while the anchor is unchanged (100%).
- **SC-002**: After the idle reminder fires or is missed, the next lifecycle event re-arms exactly one reminder.
- **SC-003**: A cold start with a 45-minute-old session clears it and schedules an idle reminder (100%).
- **SC-004**: Returning from 31 minutes in background during a session surfaces exactly one card for the 30-minute boundary.
- **SC-005**: At most one pending idle reminder exists after any sequence of foreground, background, postpone and session events.
- **SC-006**: Exactly one exact-alarm guidance message is shown per installation on Android 12+ when permission is granted.
- **SC-007**: Typecheck, lint and the full Jest suite pass.

## Clarification Gates

1. **True exact-alarm verification**
   - Context: `expo-notifications` 0.32 does not expose `canScheduleExactAlarmsAsync`.
   - Default taken: detect Android API ≥ 31 and guide the person to system settings once per installation. True verification would require a native module or `expo-intent-launcher` (new dependency, native rebuild).
   - Alternative: add `expo-intent-launcher` to deep-link to `ACTION_REQUEST_SCHEDULE_EXACT_ALARM`.

2. **Repetition mechanism**
   - Context: `TIME_INTERVAL` repeating triggers cannot be anchored to an absolute past interaction without resetting the countdown.
   - Default taken: single DATE trigger + deterministic re-arm on every lifecycle transition.
   - Alternative: repeating `TIME_INTERVAL` (loses the interaction anchor, may fire while the app is in use).

3. **Orphan threshold**
   - Default taken: 30 minutes, matching the existing stale-session threshold.
   - Alternative: a larger window (2–12 h) to allow resuming very long sessions.

## Assumptions

- The device is Android for the exact-alarm and Doze concerns; iOS keeps standard notification behavior.
- Opening the app is not a habit interaction; only smoking events and postponed pauses are.
- The 16-hour waking window and 30–240 minute clamp from feature 009 remain in force.
