# Phase 0 Research: Home Metrics & Pause Impulse Logging

Format per decision: **Decision / Rationale / Alternatives considered**.

## R1. Streak start and metric window

- **Decision**:
  - Initial streak start = `user_profile.created_at` (ISO text).
  - Every event with `resisted = 0` (ceded) becomes the new streak start; resisted events never reset it.
  - `resistedCount` and `cededCount` are lifetime totals across all stored events.
  - Elapsed time, avoided cigarettes, and money saved use the current streak window only.
- **Rationale**: Matches the spec's recommended default and the user's phrase "inicio/última recaída". Lifetime counters preserve a sense of achievement while the savings window reflects the current attempt.
- **Alternatives considered**: Reset counters on every relapse (loses history); lifetime savings (contradicts "since last relapse"); using the first event instead of profile creation (fails before any event exists).

## R2. Metric formulas

- **Decision**:
  - `streakStartMs = max(profileCreatedAtMs, latestCededTimestampMs ?? profileCreatedAtMs)`.
  - `elapsedMs = max(0, nowMs - streakStartMs)`; invalid/missing timestamps fall back to profile creation and never produce negative values.
  - `avoidedCigarettes = dailyCigarettes > 0 ? dailyCigarettes * (elapsedMs / 86_400_000) : 0`.
  - `moneySaved = packCost > 0 ? (avoidedCigarettes / 20) * packCost : 0`.
  - `resistedCount` / `cededCount` count events with `resisted === 1` / `resisted === 0`.
  - Pure functions take `nowMs` as a parameter so tests are deterministic.
- **Rationale**: Directly implements the requested formula, handles zero values and clock skew, and keeps all calculations client-side from SQLite records (FR-022). `CIGARETTES_PER_PACK = 20` already exists as a shared constant.
- **Alternatives considered**: Whole-day floor before calculating money (understates savings); `Date.now()` inside pure functions (untestable); persisting derived totals (violates dynamic-computation requirement).

## R3. Display precision and time formatting

- **Decision**: Show elapsed time as a compact human-readable duration (days/hours/minutes); show avoided cigarettes with at most one decimal; show money with the existing `formatMoney` helper and profile currency. Add a shared `formatElapsedDuration(ms)` helper for reuse and tests.
- **Rationale**: The user sees understandable progress while the underlying money calculation uses the exact fractional avoided-cigarette value. Keeps formatting out of the screen (code-rules §5).
- **Alternatives considered**: Raw milliseconds (unreadable); flooring cigarettes before money (inconsistent totals); module-only time formatter (it is general-purpose).

## R4. Live refresh strategy

- **Decision**: `useHomeMetrics` loads on focus and starts a 30-second interval while the home screen is focused; the interval is cleared on blur/unmount. The same `refresh` is called after returning from a save (focus already does this) and the periodic tick recomputes with a new `now`.
- **Rationale**: Satisfies FR-006/FR-007 without a global timer or extra dependency. A 30-second cadence keeps elapsed time feeling live while avoiding per-second re-renders.
- **Alternatives considered**: Recompute every second (unnecessary renders); only on focus (metrics look frozen during long sessions); background timers (battery cost).

## R5. Trigger taxonomy

- **Decision**: Offer exactly five new trigger codes/labels for new events:
  - `anxiety` → "Ansiedad"
  - `stress` → "Estrés"
  - `boredom` → "Aburrimiento"
  - `habit_social` → "Hábito/Social"
  - `anger_frustration` → "Ira/Frustración"
  Historical codes (`work_stress`, `coffee_social`, `other`) remain as opaque strings in existing rows. No rewrite migration is performed.
- **Rationale**: Satisfies the requested selector while preserving historical events non-destructively. Metrics do not depend on trigger values, so old rows remain fully valid. `pause_events.trigger_emotion` is already `text`, so no schema change is needed.
- **Alternatives considered**: Destructive remap of old codes (risk of mislabeling); keeping old options visible (does not meet the requested set); adding a second column (unnecessary).

## R6. Breathing timer and visual

- **Decision**:
  - Duration: 12 seconds (`REFLECTION_DURATION_SECONDS = 12`), inside the required 10–15 range.
  - Implement the countdown with the existing one-second timeout pattern, preserving the no-partial-save behavior.
  - Add a breathing visual using React Native's built-in `Animated` API (scale/opacity loop with `useNativeDriver: true`), stopped when the countdown reaches zero or the screen unmounts.
  - Outcome actions remain disabled while `secondsRemaining > 0`.
- **Rationale**: `Animated` is part of React Native, requires no new dependency, and provides a smooth native-driven visual (FR-024). The one-second state tick remains the source of truth for gating saves.
- **Alternatives considered**: `react-native-reanimated` (available but unnecessary for a simple pulse); CSS-only effects (inconsistent on native); canvas (explicitly disallowed).

## R7. Notes input and validation

- **Decision**: Add a `notes` string to `usePauseFlow`, bound to a multiline `TextInput` with `maxLength = 200`. Trim before saving; empty notes become `null`. Values over the limit are prevented by the input and re-checked before save.
- **Rationale**: Satisfies the optional short-note requirement and keeps validation near the save path. No schema change (`notes` is nullable text).
- **Alternatives considered**: No length limit (unbounded local data); required notes (contradicts optional); separate notes screen (unnecessary friction).

## R8. Duplicate-save protection

- **Decision**: Add a synchronous `savingRef` guard inside `usePauseFlow.saveOutcome` in addition to the `saving` state. Set it before the insert and clear it on failure; keep it set on success until navigation unmounts the screen.
- **Rationale**: React state updates are asynchronous, so rapid double taps could otherwise insert two events (FR-020). A ref guarantees at most one insert per intervention.
- **Alternatives considered**: Relying on the disabled button only (race remains); database unique constraint (no natural key); debounce timer (adds delay).

## R9. Post-save feedback and home refresh

- **Decision**: On success, navigate with `router.replace({ pathname: '/', params: { feedback: 'resisted' | 'ceded' } })`. The dashboard reads the optional `feedback` parameter and shows a dismissible/timed inline banner with a reinforcing message; the focus refresh recalculates metrics. The parameter is cleared from local state when the banner is dismissed.
- **Rationale**: Keeps the confirmation visible on home after navigation without coupling screens to a global store. Focus-based reload already guarantees updated metrics on return.
- **Alternatives considered**: Toast before navigation (may be hidden by the transition; iOS uses a blocking alert); global state library (unnecessary); no feedback (fails FR-016).

## R10. Error and empty states

- **Decision**: Missing profile → existing redirect to `/onboarding`; zero/negative/NaN inputs → zero metrics; storage read failure → existing dashboard error state; save failure → toast and stay on the intervention screen; invalid trigger → toast. No derived value is stored or cached.
- **Rationale**: Reuses established behaviors from features 002/003, satisfies FR-017/FR-018/FR-021, and avoids duplicated UI.
- **Alternatives considered**: Inline validation (forbidden by code-rules); silently ignoring storage errors (rejected); clearing the database on failure (destructive).

## R11. Testing strategy

- **Decision**: Extend pure unit tests for metric computation (elapsed, avoided, money, counters, cede reset, zero/clock-skew cases), shared duration formatting, and the pause mapper (new trigger codes, notes, ISO timestamp). Timer/save behavior is validated through the hook contract and manual quickstart scenarios.
- **Rationale**: Pure functions carry all business math and are deterministic with an injected `now`. React Native timer/animation behavior is best verified on a device.
- **Alternatives considered**: Rendering tests with fake timers (heavier setup for limited value); no tests for metrics (violates constitution §5.6).

## Resolved unknowns

All Technical Context fields are resolved; no `NEEDS CLARIFICATION` markers remain. The spec Clarification Gates are resolved by R1 (metric window), R1/R2 (streak start), and R5 (trigger taxonomy).
