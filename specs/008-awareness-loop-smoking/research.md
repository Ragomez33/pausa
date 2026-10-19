# Phase 0 Research: Awareness Loop & Smoking Session

Format per decision: **Decision / Rationale / Alternatives considered**.

## R1. Home primary action and awareness loop

- **Decision**: Replace the current Pausa action label/flow with a primary "Quiero fumar" / "Tengo ganas de fumar" action that opens a three-step awareness loop on the existing `/pause` route:
  1. "¿Puedes posponerlo?" with Sí/No.
  2. Four emotions: Ansiedad/Estrés, Aburrimiento, Costumbre, Presión Social.
  3. A rotating frank message and "Iniciar Cigarrillo" → `/smoking-session`.
  Create a dedicated `src/modules/awareness` module and render it from `app/pause/index.tsx`; remove the obsolete breathing PauseScreen/usePauseFlow after the new flow is wired.
- **Rationale**: Reuses the established route while matching the requested product concept. A dedicated module keeps the loop state and message rotation isolated from the session timer.
- **Alternatives considered**: Adding more steps to the old pause module (misleading naming, dead breathing code); a modal on Home (harder to test and deep-link); a new `/awareness` route (breaks existing links).

## R2. Postponement persistence

- **Decision**: Add `postponed_count` integer not null default 0 to `user_profile`. The "Sí" branch increments it atomically with `UPDATE ... SET postponed_count = postponed_count + 1 RETURNING`. No smoking event is written.
- **Rationale**: The request explicitly names `posponed_count` as a user metric; a counter column is simple and atomic. It is also easy to expose in Home/History later.
- **Alternatives considered**: Deriving from an event table (more relational but the request asks for a count); a separate metrics table (overkill for one counter).

## R3. Smoking events and inventory

- **Decision**: Add `smoking_events` (`id`, `timestamp` ISO, `trigger_emotion`, `duration_seconds`, `inventory_decremented` 0/1). Completing a session:
  1. Reads current inventory stock.
  2. Inserts the smoking event.
  3. If stock > 0, inserts a one-cigarette `consumption` inventory log and records `inventory_decremented = 1`; otherwise records 0 and shows a notice.
  4. Runs event + inventory insert together in a database transaction.
- **Rationale**: Keeps session history separate from pause events (different semantics: duration, trigger, consumption). Inventory remains derived from logs and never goes negative. A transaction prevents a recorded session without its inventory effect when stock exists.
- **Alternatives considered**: Reusing `pause_events` (duration/session semantics are a poor fit); negative inventory (misleading); blocking completion when empty (the person already smoked).

## R4. Daily smoked counter and limit

- **Decision**: Derive "smoked today" from `smoking_events` counts between local-day boundaries with a Drizzle aggregate query (`count()` + `between`). The limit is `user_profile.daily_cigarettes`. Show `today / limit` on Home; if the limit is zero, show it as unavailable.
- **Rationale**: No mutable counter to drift; local calendar-day boundaries match the person's expectations. Aggregation avoids loading all events.
- **Alternatives considered**: Storing a daily counter (needs reset logic); UTC-day boundaries (wrong near local midnight).

## R5. Session timer and five-minute prompt

- **Decision**: Use a wall-clock start timestamp and a one-second interval to recompute elapsed seconds (ascending display). Track the next prompt boundary at 300-second multiples; when reached, show an in-screen modal "¿Terminaste?" with "Seguir" and "Terminé". The modal is native (`Modal`/`View`) and does not pause the timer. A synchronous finish guard prevents duplicate records. Leaving the screen before finish writes nothing.
- **Rationale**: Wall-clock elapsed time stays accurate if the app is briefly backgrounded and does not block the UI. The five-minute boundaries are deterministic. The finish guard satisfies FR-016.
- **Alternatives considered**: Decrementing a counter every second (drifts); `setInterval`-only elapsed (wrong after backgrounding); `Alert` (less consistent styling); reanimated timers (unnecessary).

## R6. Notifications scheduling

- **Decision**: Extend `src/shared/utils/notifications.ts` with:
  - `INACTIVITY_MESSAGE = 'Tienes ganas de fumar? Abre la app antes de encenderlo.'`
  - `calculateReminderIntervalMinutes(dailyCigarettes, wakingHours = 16)`: `max(30, wakingHours * 60 / dailyCigarettes)`.
  - `scheduleInactivityReminders(dailyCigarettes)`: request permission, cancel existing scheduled notifications to prevent duplicates, then schedule the next 24 hours of reminders within an 08:00–22:00 waking window using date triggers. Return `{ scheduled, permissionGranted }`.
  - `cancelInactivityReminders()`.
  Use a `useInactivityReminders` hook on Home focus with deduplication via cancel/replace.
- **Rationale**: Meets the interval formula, exact message, waking-hours requirement, permission handling, and duplicate prevention. Keeping the service in `src/shared/utils` follows the constitution's shared-utility structure (the request's `src/services/` path is superseded).
- **Alternatives considered**: A single repeating interval trigger (fires at night); `src/services/notifications.ts` duplicate handler (splits notification ownership); scheduling without cancellation (duplicate reminders).

## R7. Teams schema and ranking stub

- **Decision**: Add `teams` (`id`, `name`, `goal_level`, `duration_days`, `created_at`) and `team_members` (`id`, `team_id`, `local_name`, `daily_limit`, `status`) with a foreign key from members to teams. Update the existing TeamScreen with static stub sections "El Guardián", "El Inquebrantable", and "El Resiliente", plus an empty-state note. No team creation UI in this feature.
- **Rationale**: Provides the requested foundation without pretending to implement multiplayer synchronization. The rank names are presentation labels; the schema is ready for future logic.
- **Alternatives considered**: Full team CRUD (out of scope); no schema (would require a later migration); keeping the placeholder only (does not satisfy rank stubs).

## R8. Message bank and rotation

- **Decision**: Add `src/shared/constants/messages.ts` with a frank, realistic message array about smell, money, and habit. Pick a random message each loop, excluding the immediately previous message when more than one exists. Keep message constants centralized per code-rules §5.
- **Rationale**: Satisfies the rotating conscious-message step and avoids immediate repetition. Centralizing the bank keeps copy reviewable.
- **Alternatives considered**: Sequential rotation (predictable); including the same message twice in a row (weakens the intervention); hardcoding messages in the screen (forbidden by code-rules §5).

## R9. Schema/migration approach

- **Decision**: Add migration `drizzle/0005_awareness_teams.sql`:
  - `ALTER TABLE user_profile ADD postponed_count integer NOT NULL DEFAULT 0`
  - `CREATE TABLE smoking_events`
  - `CREATE TABLE teams`
  - `CREATE TABLE team_members`
  - indexes on `smoking_events.timestamp` and `team_members.team_id`
  Update the journal and `migrations.js`; validate 0000–0005 with Node's `node:sqlite`.
- **Rationale**: Additive migration that preserves existing data. The new `postponed_count` default keeps existing profiles valid.
- **Alternatives considered**: Rebuilding user_profile (unnecessary risk); deriving counts from events (conflicts with the explicit counter requirement).

## R10. Error and empty behavior

- **Decision**: Missing profile → onboarding. Session finish with empty inventory → still record with a notice. Storage failures → no partial session; toast/error state. Notifications denied → app usable, reminders disabled. Team empty → stub empty state. Notification scheduling failure → non-blocking toast.
- **Rationale**: Matches spec edge cases and existing app conventions.
- **Alternatives considered**: Blocking the session on storage errors (punishes the person); silent failures (rejected); allowing negative stock (rejected).

## R11. Testing strategy

- **Decision**: Unit-test reminder interval clamping/formula, message selection (no immediate repeat), session duration formatting, smoking-event mapping, today's day-range helper, and awareness state transitions/validation. Validate migration 0005 with `node:sqlite`. Timer/notification behavior is validated on device via `quickstart.md`.
- **Rationale**: Pure logic carries the risk; native scheduling and timers require device validation.
- **Alternatives considered**: Mocking expo-notifications in Jest (brittle); no tests for session math (violates constitution §5.6).

## Resolved unknowns

All Technical Context fields are resolved; no `NEEDS CLARIFICATION` markers remain. Spec Clarification Gates are resolved by R2 (postponement persistence), R3 (empty inventory), and R6 (waking window).
