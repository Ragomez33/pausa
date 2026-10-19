# Implementation Plan: Badges & Milestones

**Branch**: `007-badges-milestones` | **Date**: 2026-10-19 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/007-badges-milestones/spec.md`

## Summary

Add a local achievements system with a static six-badge catalog and a persistent `user_badges` table. A pure evaluator compares the person's current streak, resisted-pause count, and estimated savings against each catalog condition, computes capped progress, and identifies newly eligible badges. A service persists missing unlocks idempotently (unique key, batch insert, `onConflictDoNothing`) and returns new badges for feedback. Badge evaluation runs automatically on Home focus and on the `/badges` screen, with a lightweight toast for new unlocks. Existing derived metrics are extracted into shared helpers so badges, Home, and History agree.

## Technical Context

**Language/Version**: TypeScript 5.9 (`strict: true`), React Native 0.81, Expo SDK 54

**Primary Dependencies**: Expo Router v6; NativeWind v4 + Tailwind CSS 3.4; Drizzle ORM 0.45 + expo-sqlite 16. No new dependencies.

**Storage**: Existing local SQLite `pausa.db` through `src/db/`. New `user_badges` table with a unique badge-key index via additive migration `drizzle/0004_user_badges.sql`. Existing tables untouched.

**Testing**: Jest (`jest-expo`). Unit tests for catalog integrity, condition evaluation, progress capping, eligibility/idempotency, unknown keys, and shared derived-metric behavior. Device validation via `quickstart.md`.

**Target Platform**: Mobile (iOS/Android), Expo managed.

**Project Type**: mobile-app (single frontend project; no backend).

**Performance Goals**: Badge evaluation is O(catalog size = 6) over small aggregate values and completes within a frame; screen renders six cards; Home evaluation does not block first paint.

**Constraints**: Local-only (0 network calls); unlock records immutable and unique; evaluation idempotent; progress capped `[0,100]`; strict typing; NativeWind/native primitives; no heavy graphics; no schema changes to existing tables.

**Scale/Scope**: 1 new table; 6 static badges; 1 new screen; 2 evaluation entry points (Home and badges); 1 shared metric refactor; single local user.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Constitution / code-rules reference | Status |
|------|--------------------------------------|--------|
| Source under `src/`; `app/` thin routing only | Constitution §1.1/§1.2, code-rules §9 | PASS — new badges module + thin route |
| Domain storage only via Drizzle/SQLite | Constitution §3, code-rules §11/§12 | PASS — `user_badges` through `src/db` |
| Local-first privacy | Constitution §3, code-rules §12 | PASS — no network/sync |
| Strict typing, no `any`/`unknown` | code-rules §1 | PASS — explicit catalog/status/outcome types |
| UI strictly NativeWind + RN primitives | code-rules §4 | PASS — cards, bars, text only |
| Constants out of components | code-rules §5 | PASS — catalog/labels in module constants |
| Form state consolidated | code-rules §6 | N/A — no forms |
| Validation via Zod + toasts | code-rules §3/§7 | PASS — unlock/error feedback via `showAppToast` |
| Atomic try/catch + pure helpers | code-rules §8 | PASS — pure evaluator; service isolates DB calls |
| DESC ordering for historical getters | code-rules §11 | PASS — unlocks DESC by `unlocked_at` |
| Shared derived metrics | Constitution §1.2, code-rules §5.5 | PASS — shared helper used by Home/History/badges |
| No heavy graphics dependency | Feature FR-022 | PASS — native cards/progress bars |
| Specs in EARS | Constitution §4 | PASS |

**Result**: No violations. No Complexity Tracking entries required.

**Post-Design Re-evaluation (after Phase 1)**: PASS — the model enforces unique immutable unlocks, the contract keeps evaluation pure/idempotent, and shared metrics preserve cross-screen consistency. No new violations.

## Project Structure

### Documentation (this feature)

```text
specs/007-badges-milestones/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 decisions
├── data-model.md        # Catalog, unlock table, derived status
├── quickstart.md        # Phase 1 validation guide
├── contracts/
│   ├── database.md      # Persistence + evaluation contract
│   └── routes.md        # Home/badges interaction contract
└── checklists/
    └── requirements.md  # Spec quality checklist
```

### Source Code (repository root)

```text
app/
├── _layout.tsx                     # register badges Stack screen
├── index.tsx                       # unchanged thin route
└── badges/index.tsx                # NEW /badges → BadgesScreen

src/
├── db/
│   ├── schema.ts                   # + userBadges table/types + unique index
│   └── queries.ts                  # + listUserBadges, unlockBadges
├── modules/
│   ├── badges/                     # NEW module
│   │   ├── utils/catalog.ts        # six static badge definitions
│   │   ├── utils/evaluate.ts       # pure state/progress/eligibility
│   │   ├── utils/service.ts        # evaluate + persist missing unlocks
│   │   ├── hooks/useBadgeEvaluation.ts
│   │   ├── hooks/useBadges.ts
│   │   ├── views/BadgesScreen.tsx
│   │   └── tests/unit/evaluate.test.ts
│   ├── dashboard/
│   │   ├── views/DashboardScreen.tsx   # + Logros action + evaluation hook
│   │   └── utils/metrics.ts            # use/re-export shared derived helpers
│   └── history/
│       └── utils/analytics.ts          # use shared streak resolver
└── shared/
    ├── utils/derivedMetrics.ts     # NEW shared streak/savings formulas
    └── constants/app.ts            # existing constants (reused)

drizzle/
├── 0004_user_badges.sql            # additive table + unique index
└── meta/_journal.json              # journal entry
```

**Structure Decision**: Badge logic stays in `src/modules/badges`. Derived formulas used by multiple modules move to `src/shared/utils/derivedMetrics.ts`, satisfying the constitution's shared-helper rule. The route remains thin; Home only calls the evaluation hook and renders a link.

## Implementation Notes

1. **Schema/migration**: `user_badges` (`id`, `badgeKey`, `unlockedAt`) with unique index on `badgeKey`; additive `0004` migration registered in journal and `migrations.js`.
2. **Queries**: `listUserBadges()` DESC by unlock time; `unlockBadges(entries)` no-ops on empty input and batch-inserts missing keys with `onConflictDoNothing`.
3. **Catalog**: Six definitions exactly as specified in `data-model.md`; each has key, title, description, condition type, target, and unit.
4. **Evaluator**: `evaluateBadges(state, unlockedKeys)` returns catalog statuses plus `newKeys`; progress is capped and never negative; unknown stored keys are ignored.
5. **Shared metrics**: Extract `parseIsoTimestamp`, `resolveStreakStartMs`, `computeElapsedMs`, `computeAvoidedCigarettes`, `computeMoneySaved`, and `DAY_MS` to `src/shared/utils/derivedMetrics.ts`; update Home metrics and History analytics to use them while preserving exports/tests.
6. **Service**: `evaluateAndUnlockBadges(nowMs)` reads profile, pause totals, latest ceded, and unlocked keys; builds `BadgeState`; persists new keys with one ISO timestamp; returns `{ newBadges, error }`.
7. **Home**: `useBadgeEvaluation` runs on focus, shows a toast naming new badges, and silently ignores no-op evaluations. Add a "Logros" chip to Home alongside History/Inventory.
8. **Badges screen**: `useBadges` evaluates then loads statuses; renders unlocked count and six cards (unlocked accent + localized date; locked muted + progress bar).
9. **Tests**: Catalog uniqueness; eligibility for all six conditions; progress caps/negatives; idempotency with existing keys; unknown keys; zero-state.

## Complexity Tracking

> No constitution violations; section intentionally empty.
