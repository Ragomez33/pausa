# Phase 0 Research: Badges & Milestones

Format per decision: **Decision / Rationale / Alternatives considered**.

## R1. Badge persistence model

- **Decision**: Add a `user_badges` table:
  - `id` integer PK autoincrement
  - `badge_key` text not null
  - `unlocked_at` text ISO not null
  - unique index `idx_user_badges_badge_key` on `badge_key`
  Add an additive migration `drizzle/0004_user_badges.sql`, register it in the journal and `drizzle/migrations.js`.
- **Rationale**: One row per earned milestone, with a database-level uniqueness guarantee (FR-002). The static catalog stays in code, so only unlocks are persisted.
- **Alternatives considered**: Storing all badge definitions in the database (duplicates code constants, needs seeding); storing a JSON array on the profile (breaks relational access and uniqueness); no unique constraint (duplicates possible under rapid evaluation).

## R2. Static catalog

- **Decision**: Define six badges in `src/modules/badges/utils/catalog.ts`:
  - `first_pause` — first resisted pause (target 1)
  - `five_pauses` — five resisted pauses (target 5)
  - `1_day_clean` — 1-day active streak (target 1)
  - `1_week_clean` — 7-day active streak (target 7)
  - `1_month_clean` — 30-day active streak (target 30)
  - `money_saver_10` — estimated savings of 10 currency units (target 10)
  Each definition has key, title, description, condition type, target, and a display unit.
- **Rationale**: Covers the three requested condition families (time, resisted pauses, money) with the examples provided. Static definitions keep the screen and evaluator deterministic and testable.
- **Alternatives considered**: A larger tiered catalog (more UI noise for the MVP); database-driven definitions (unnecessary complexity).

## R3. Badge state and progress

- **Decision**: Compute a `BadgeState` from existing local data:
  - `resistedPauses` from the existing pause totals aggregation
  - `streakDays` from the shared streak start and elapsed-time helpers
  - `moneySaved` from the shared avoided-cigarette and savings formulas
  Then a pure `evaluateBadges(state, unlockedKeys)` returns catalog statuses plus newly eligible keys. Progress is `min(value, target)` and `min(100, value / target * 100)`, clamped at zero; unlocked badges omit progress.
- **Rationale**: Keeps the badge condition logic pure and identical to Home/History calculations. Capping progress satisfies the edge cases and makes the UI safe.
- **Alternatives considered**: Recomputing formulas separately in the badges module (drift risk); storing progress in the database (derived data should not be persisted).

## R4. Shared derived-metric helpers

- **Decision**: Extract the common pure calculations into `src/shared/utils/derivedMetrics.ts`:
  - `parseIsoTimestamp`, `resolveStreakStartMs`, `computeElapsedMs`, `computeAvoidedCigarettes`, `computeMoneySaved`, `DAY_MS`.
  Update `src/modules/dashboard/utils/metrics.ts` to import/re-export them so existing Home behavior and tests remain intact. Update `src/modules/history/utils/analytics.ts` to use the shared streak resolver.
- **Rationale**: Badge conditions must match the numbers the person already sees on Home. A shared helper prevents formulas from diverging across modules (constitution §1.2 / code-rules §5.5).
- **Alternatives considered**: Importing the dashboard module from badges (module coupling); duplicating the formulas (drift risk).

## R5. Idempotent unlock persistence

- **Decision**: Add `listUserBadges()` (DESC by unlock time) and `unlockBadges(entries)` in `src/db/queries.ts`. `unlockBadges` inserts all missing keys in one statement with `onConflictDoNothing({ target: userBadges.badgeKey })`; empty input is a no-op. Evaluation reads existing keys, computes eligible keys, and inserts only the difference with a single ISO timestamp for the batch.
- **Rationale**: Guarantees FR-012/FR-013/FR-020 even if evaluation runs twice quickly or several Home renders overlap. The original unlock timestamp is never changed.
- **Alternatives considered**: Read-then-insert without a unique constraint (race risk); updating unlock time on re-evaluation (changes history); one insert per key (more statements).

## R6. Evaluation triggers and feedback

- **Decision**: Provide `evaluateAndUnlockBadges(nowMs)` returning `{ newBadges, error }`. Use it:
  - On Home focus via `useBadgeEvaluation` (which shows a toast naming new badges).
  - On the badges screen focus before rendering statuses.
  Saving a pause returns to Home, so the Home focus evaluation covers the post-save requirement.
- **Rationale**: Covers every requested evaluation moment without coupling badge logic into the pause module. New unlocks are announced once; subsequent evaluations find them already stored and stay silent.
- **Alternatives considered**: Calling evaluation inside the pause hook (couples modules and complicates navigation feedback); a global app state listener (unnecessary).

## R7. Badges screen and route

- **Decision**: Add `app/badges/index.tsx` rendering `BadgesScreen`, register `badges` in the root `Stack`, and add a "Logros" action on Home. The screen shows unlocked count, all six catalog cards, unlock dates for earned badges, and muted locked cards with a progress bar. Use `ScrollView` (six cards) and NativeWind only.
- **Rationale**: Static small catalog does not need virtualization; a dedicated route keeps Home focused and follows the resource-folder convention (code-rules §9).
- **Alternatives considered**: Integrating into Home (crowded); embedding in History (mixes two concerns); a modal (less discoverable).

## R8. Error and empty behavior

- **Decision**: Missing profile → no evaluation and the existing onboarding redirect. Storage failure during evaluation → return an error, show a non-blocking toast on Home/Badges, and leave existing unlocks untouched. A badge key stored but absent from the catalog is ignored. Empty/zero state shows all badges locked with 0% progress.
- **Rationale**: Satisfies FR-018/FR-019 and the edge cases without destructive recovery.
- **Alternatives considered**: Clearing badge records on failure (destructive); blocking Home when badges cannot load (disproportionate).

## R9. Migration validation and tests

- **Decision**: Hand-write the additive `0004` migration (table + unique index), register it, and validate it with Node's `node:sqlite` by applying 0000–0004 and asserting columns/index plus duplicate-insert rejection. Unit-test catalog uniqueness, progress, eligibility, idempotency (existing keys), unknown keys, and zero/negative states.
- **Rationale**: Deterministic additive migration; pure tests cover all condition math. Native query behavior is validated on device through the quickstart.
- **Alternatives considered**: `drizzle-kit generate` interactive prompts; skipping migration validation (risk to installed databases).

## R10. Unlock date display

- **Decision**: Display unlock dates with the shared localized date/time formatter. Invalid stored values fall back to the raw string.
- **Rationale**: Reuses tested formatting and respects the device locale.
- **Alternatives considered**: Fixed date format (ignores locale); hiding invalid dates (loses information).

## Resolved unknowns

All Technical Context fields are resolved; no `NEEDS CLARIFICATION` markers remain. Spec Clarification Gates are resolved by R2 (catalog), R6 (evaluation moments), and R6/R7 (feedback).
