# Phase 0 Research: Onboarding & Pause Button Flow

Format per decision: **Decision / Rationale / Alternatives considered**.

## R1. Schema realignment and migration

- **Decision**: Extend `src/shared/db/schema.ts`:
  - Add `dailyCigarettes` (integer), `packCost` (real), `currency` (text), `quitGoal` (text) to
    `user_profile`.
  - Add `pauseEvents` table (`id`, `createdAt`, `triggerEmotion`, `resisted` 0/1, `notes`).
  - Regenerate a new migration with `drizzle-kit generate`; keep existing migrations.
- **Rationale**: The scaffold's `user_profile` was a placeholder. This adds the profile fields the
  feature needs without destroying existing data. SQLite migrations are additive.
- **Alternatives considered**: Recreating the DB (data loss); a separate `profile_settings` table
  (needless split for a single-user app); reusing `smoke_logs` for pause events (semantically wrong —
  `pause_events` records impulses and outcomes, not necessarily consumptions).

## R2. Path convention (`src/db/` vs `src/shared/db/`)

- **Decision**: Use `src/shared/db/` (constitution §1.1) instead of the prompt's `src/db/`.
- **Rationale**: The constitution is the highest authority (constitution §1.3). The DB layer is shared
  across modules, so `src/shared/db/` is correct.
- **Alternatives considered**: `src/db/` (violates the mandated structure); a per-module DB (would
  fragment a single database).

## R3. Data access without blocking render

- **Decision**: Read/write through small hooks (`useHomeMetrics`, `useOnboardingProfile`,
  `usePauseFlow`) that run queries inside `useEffect`/`useFocusEffect`, keep `try` blocks to 1–3 lines
  (code-rules §8), and expose `{ data, loading, error, refresh }`. Pure transformations/calculations
  live in `utils/` mappers.
- **Rationale**: Satisfies "do not block the main thread" and the atomic try/catch rule without adding
  a query library. expo-sqlite's Drizzle calls are fast at this scale; running them after mount avoids
  blocking first render.
- **Alternatives considered**: Raw async `expo-sqlite` (bypasses Drizzle, forbidden); adding React Query
  (unnecessary dependency for local-only data); top-level queries in render (blocks/janks).

## R4. Onboarding form state and validation

- **Decision**: One `formData` state object typed from a `zod` schema inferred type; validate on submit;
  route validation failures through `showAppToast` (no inline field errors). Use a clean single-screen
  form consistent with the spec ("wizard or clean form").
- **Rationale**: code-rules §3 (no inline validation, zod + toasts) and §6 (consolidated form object).
- **Alternatives considered**: Multiple `useState` per field (forbidden by §6); inline error text
  (forbidden by §3); a form library (heavy, unnecessary).

## R5. Reflection timer

- **Decision**: Default 15-second timer implemented in `usePauseFlow` with an interval + cleanup,
  exposing `secondsRemaining` and `isRunning`; outcome controls are disabled while `isRunning`.
  Leaving the screen clears the timer and persists nothing.
- **Rationale**: Keeps the habit-interruption mechanic in the 10–30s range (FR-006/FR-008/FR-011),
  avoids extra dependencies, and guarantees no partial event on interruption.
- **Alternatives considered**: `react-native-reanimated`-driven timer (available but overkill for a
  countdown); a hard-coded unchangeable delay (less flexible).

## R6. Trigger options and constants

- **Decision**: `TRIGGER_OPTIONS` (anxiety, work stress, coffee/social, boredom) and timer duration in
  `src/modules/pause/utils/constants.ts`; onboarding currency options/defaults in
  `src/modules/onboarding/utils/constants.ts`.
- **Rationale**: code-rules §5 forbids static option lists inside components.
- **Alternatives considered**: Inline arrays in the screen (forbidden).

## R7. Metric definitions (money saved, streak)

- **Decision**:
  - `resistedCount` = number of `resisted = true` events.
  - `currentStreak` = count of the most recent consecutive events (DESC by timestamp) with
    `resisted = true`.
  - `moneySaved` = `resistedCount * (packCost / CIGARETTES_PER_PACK)`, with
    `CIGARETTES_PER_PACK = 20` as a documented shared constant (the profile has no pack-size field).
  - All computed by pure functions in `src/modules/dashboard/utils/metrics.ts`.
- **Rationale**: Deterministic, testable, and derived only from stored data (FR-014). Each resisted
  pause is treated as one avoided cigarette. Currency is displayed from the profile.
- **Alternatives considered**: Time-projection based on `dailyCigarettes` (ambiguous without a
  consumption log); adding `packSize` to the profile (not in the requested schema — deferred).

## R8. Profile existence and redirect

- **Decision**: A `useHomeMetrics`/`useProfile` hook returns `hasProfile`; the home view redirects to
  `/onboarding` via Expo Router `Redirect` when no profile exists, and onboarding redirects to `/` after
  a successful save (`router.replace`).
- **Rationale**: Satisfies FR-004/FR-009 and avoids a flash of the home screen.
- **Alternatives considered**: Putting guards in `app/_layout.tsx` (couples auth to DB init); a global
  state library (unnecessary).

## R9. Error handling and notifications

- **Decision**: All user-facing validation/storage errors go through `showAppToast`; storage failures
  surface a clear message and do not persist partial data.
- **Rationale**: code-rules §3/§7.
- **Alternatives considered**: Inline errors or silent failure (both forbidden).

## Resolved unknowns

All Technical Context fields are resolved; no `NEEDS CLARIFICATION` markers remain. The `streak`
definition and the money-saved formula are fixed in R7 and documented as assumptions.
