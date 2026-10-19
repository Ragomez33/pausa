# Implementation Plan: Home Metrics & Pause Impulse Logging

**Branch**: `004-home-pause-impulse-logging` | **Date**: 2026-10-19 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-home-pause-impulse-logging/spec.md`

## Summary

Extend the existing home dashboard with four live progress metrics computed from the stored profile and impulse history: current-streak elapsed time, avoided cigarettes, estimated money saved, and lifetime resisted/ceded counts. Enhance the Pausa intervention with a 12-second breathing countdown, the five requested trigger options, optional short notes, a duplicate-save guard, and a post-save return to home with a reinforcing banner. No database schema change is required; all math remains client-side over the existing Drizzle/SQLite data.

## Technical Context

**Language/Version**: TypeScript 5.9 (`strict: true`), React Native 0.81, Expo SDK 54

**Primary Dependencies**: Expo Router v6; NativeWind v4 + Tailwind CSS 3.4; Drizzle ORM 0.45 + expo-sqlite 16; Zod v4; React Native `Animated`. No new dependencies.

**Storage**: Existing local SQLite `pausa.db` through `src/db/`. Reads `user_profile` and `pause_events`; appends `pause_events`. No migration in this feature.

**Testing**: Jest (`jest-expo`). Unit tests for metric formulas, duration/currency formatting, trigger options, pause validation schema, and event mapping. Timer/animation behavior validated with `quickstart.md` on a device.

**Target Platform**: Mobile (iOS/Android), Expo managed.

**Project Type**: mobile-app (single frontend project; no backend).

**Performance Goals**: Home first meaningful paint within the existing loading flow; metric recomputation completes in a single frame; 30-second refresh tick while visible; countdown and breathing animation remain responsive for 12 seconds.

**Constraints**: Local-first (0 network calls); all money/cigarette values derived dynamically; no schema change; strict typing (no `any`/`unknown`); toasts only for errors; thin routes; one event per intervention; no heavy animation dependency.

**Scale/Scope**: 2 existing tables; 1 home view + 1 intervention view; 5 trigger options; 2 outcome actions; single user.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Constitution / code-rules reference | Status |
|------|--------------------------------------|--------|
| Source under `src/`; `app/` thin routing only | Constitution §1.1/§1.2, code-rules §9 | PASS — only module views/hooks change |
| Domain storage only via Drizzle/SQLite | Constitution §3, code-rules §11/§12 | PASS — existing `createPauseEvent`/queries |
| Local-first privacy (emotional triggers local) | Constitution §3, code-rules §12 | PASS — no network, notes/triggers stay local |
| Strict typing, no `any`/`unknown` | code-rules §1 | PASS — explicit `HomeMetrics`, trigger union, result types |
| UI strictly NativeWind + RN primitives | code-rules §4 | PASS — RN `Animated`, `View`, `Text`, `TextInput`, `TouchableOpacity` |
| Constants out of components | code-rules §5 | PASS — triggers, duration, notes limit in `pause/utils/constants.ts` |
| Form state consolidated (≤3 `useState`) | code-rules §6 | PASS — consolidate trigger + notes into one `form` object; timer/saving remain separate (3 total) |
| Validation via Zod + toasts, no inline errors | code-rules §3/§7 | PASS — new pause form schema + `showAppToast` |
| Atomic try/catch + pure mappers | code-rules §8 | PASS — DB call isolated; math/formatting pure |
| DESC ordering for historical getters | code-rules §11 | PASS — existing `listPauseEvents` DESC by timestamp |
| Idempotent startup initialization | Constitution §3, feature 003 | PASS — unchanged |
| No heavy animation/canvas dependency | Feature FR-024 | PASS — built-in RN `Animated` |
| Specs in EARS | Constitution §4 | PASS |

**Result**: No violations. No Complexity Tracking entries required.

**Post-Design Re-evaluation (after Phase 1)**: PASS — the data model confirms no schema change, metrics remain pure and derived, trigger history is preserved, and the intervention contract enforces countdown gating and single-save behavior. No new violations.

## Project Structure

### Documentation (this feature)

```text
specs/004-home-pause-impulse-logging/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 decisions
├── data-model.md        # Derived metrics + existing entities
├── quickstart.md        # Phase 1 validation guide
├── contracts/
│   ├── database.md      # Metrics + persistence contract
│   └── routes.md        # Home/intervention interaction contract
└── checklists/
    └── requirements.md  # Spec quality checklist
```

### Source Code (repository root)

```text
app/
├── index.tsx                     # / → DashboardScreen (unchanged thin route)
├── pause/index.tsx               # /pause → PauseScreen (unchanged thin route)
└── _layout.tsx                   # unchanged (startup/profile guard)

src/
├── modules/
│   ├── dashboard/
│   │   ├── views/DashboardScreen.tsx      # 4 metric cards, Pausa button, feedback banner
│   │   ├── hooks/useHomeMetrics.ts        # focus load + 30s tick + refresh
│   │   ├── utils/metrics.ts               # streak start, elapsed, avoided, money, counts
│   │   └── tests/unit/metrics.test.ts     # expanded formula tests
│   └── pause/
│       ├── views/PauseScreen.tsx          # breathing visual, triggers, notes, actions
│       ├── hooks/usePauseFlow.ts          # countdown, consolidated form, save guard
│       ├── utils/constants.ts             # 5 triggers, 12s duration, notes limit
│       ├── utils/schema.ts                # zod trigger/notes validation
│       ├── utils/mappers.ts               # unchanged buildPauseEvent (notes supported)
│       └── tests/unit/{mappers,schema}.test.ts
├── shared/
│   ├── types/global.ts                    # HomeMetrics shape + TriggerEmotion union
│   ├── utils/utils.ts                     # formatElapsedDuration
│   └── tests/unit/utils.test.ts           # duration formatting tests
└── db/                                    # unchanged schema/client/queries
```

**Structure Decision**: Keep the constitution-mandated module layout. Home logic stays in `src/modules/dashboard`, intervention logic in `src/modules/pause`, and cross-cutting formatting/types in `src/shared`. Routes remain thin and unchanged. No database migration is introduced.

## Implementation Notes

1. **Metric computation**: `computeHomeMetrics(profile, events, nowMs)` computes streak start as `max(profile.createdAt, latest ceded timestamp)`; clamps elapsed to `>= 0`; computes avoided cigarettes with `dailyCigarettes * elapsed / 86_400_000`; money as `(avoided / 20) * packCost`; and lifetime resisted/ceded counts. Invalid timestamps/currency fall back safely.
2. **Home refresh**: `useHomeMetrics` loads in `useFocusEffect` and registers a 30-second interval that recomputes with a fresh `now`; interval cleanup occurs on blur/unmount. `refresh` remains exposed.
3. **Dashboard UI**: Replace the current three cards with four readable metrics (elapsed time, avoided cigarettes, money saved, resisted vs. ceded) and keep the central Pausa button. Add an inline feedback banner driven by the optional `feedback` route parameter, dismissible and non-blocking.
4. **Pause state**: Consolidate `selectedTrigger` and `notes` into one `form` state object (3 `useState` total with countdown and saving). Add a zod schema for trigger/notes, trim notes, and enforce `maxLength={200}` in the input.
5. **Countdown + breathing**: Set `REFLECTION_DURATION_SECONDS = 12`. Keep the one-second tick as the save gate. Add an `Animated` scale/opacity loop with `useNativeDriver: true`, stopped when the countdown ends or the screen unmounts.
6. **Save flow**: Validate with zod; block if no trigger; use a `savingRef` synchronous guard plus the `saving` state; call `createPauseEvent(buildPauseEvent(...))` inside a 1–3 line `try`; on success `router.replace({ pathname: '/', params: { feedback: ... } })`; on failure toast and stay.
7. **Trigger taxonomy**: New writes use `anxiety`, `stress`, `boredom`, `habit_social`, `anger_frustration`. Historical strings remain untouched. `TriggerEmotion` covers the new writes; historical values are tolerated because the DB column is text and metrics do not use triggers.
8. **Tests**: Expand metric tests for zero values, elapsed reset, clock skew, money formula, counters, and one-decimal formatting; add duration formatting tests; add pause schema tests; extend mapper tests for the new triggers and notes.

## Complexity Tracking

> No constitution violations; section intentionally empty.
