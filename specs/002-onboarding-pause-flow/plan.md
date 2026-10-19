# Implementation Plan: Onboarding & Pause Button Flow

**Branch**: `002-onboarding-pause-flow` | **Date**: 2026-10-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-onboarding-pause-flow/spec.md`

## Summary

Implement the first functional module of Pausa: a first-run onboarding that creates and persists a
local user profile, a home dashboard that shows dynamic metrics plus the central "Pausa" button and
redirects to onboarding when no profile exists, and a pause flow with a short reflection timer,
trigger selection, and resisted/ceded outcome saved as a local pause event. Everything is local-first
(Drizzle + expo-sqlite), styled with NativeWind, and exposed through thin Expo Router routes.

## Technical Context

**Language/Version**: TypeScript 5.9 (`strict: true`), React Native 0.81, Expo SDK 54

**Primary Dependencies**: Expo Router v6; NativeWind v4 + Tailwind CSS 3.4; Drizzle ORM + expo-sqlite;
`zod`; `lucide-react-native`; `react-native-safe-area-context`; `react-native-reanimated` (available).
No network/UI-framework libraries.

**Storage**: Local SQLite via `expo-sqlite`, accessed only through Drizzle ORM at
`src/shared/db/` (constitution §1.1/§3). New migration for `pause_events` and new profile columns.

**Testing**: Jest (`jest-expo`). Unit tests for validation schemas, mappers, and metric calculations.

**Target Platform**: Mobile (iOS/Android), Expo managed.

**Project Type**: mobile-app

**Performance Goals**: Home renders first interactive frame < 2s after DB ready; metric computation
and queries complete within a single frame budget on a mid-tier device.

**Constraints**: Local-first (0 network calls); strict typing (no `any`/`unknown`); no inline field
validation (toasts only); UI only with native components + NativeWind `className`; queries/hooks must
not block render; metrics never hardcoded.

**Scale/Scope**: 3 screens/flows (onboarding, home, pause); 2 tables touched; ~1 form; 4 trigger
options; single user profile.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Constitution / code-rules reference | Status |
|------|--------------------------------------|--------|
| Source under `src/`; `app/` thin routing only | Constitution §1.1/§1.2, code-rules §9 | PASS — routes import module views |
| Domain storage only via Drizzle/SQLite | Constitution §3, code-rules §11/§12 | PASS — no AsyncStorage, no network |
| Local-first privacy (emotional triggers local) | Constitution §3, code-rules §12 | PASS — `trigger_emotion` never synced |
| Strict typing, no `any`/`unknown` | code-rules §1 | PASS — zod-inferred form types + explicit returns |
| UI strictly NativeWind + RN primitives | code-rules §4 | PASS — no component library |
| Constants out of components (`TRIGGER_OPTIONS`, etc.) | code-rules §5 | PASS — module `utils/constants.ts` |
| Form state consolidated (≤3 `useState`) | code-rules §6 | PASS — single `formData` object |
| Validation via zod + toasts, no inline errors | code-rules §3/§7 | PASS — `showAppToast` |
| Atomic try/catch + mappers/pure helpers | code-rules §8 | PASS — pure calculations in `utils/` |
| DESC ordering for historical getters | code-rules §11 | PASS — `pause_events` ordered by timestamp DESC |
| Specs in EARS | Constitution §4 | PASS |

**Result**: No violations. No Complexity Tracking entries required.

**Post-Design Re-evaluation (after Phase 1)**: PASS — the data model, route contract, and DB contract
preserve all gates. `src/shared/db/` is used (not `src/db/`), triggers remain local, DESC ordering and
atomic writes are specified. No new violations.

## Project Structure

### Documentation (this feature)

```text
specs/002-onboarding-pause-flow/
├── plan.md              # This file
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/
│   ├── routes.md        # Navigation contract
│   └── database.md      # Persistence contract
└── tasks.md             # Phase 2 (/speckit.tasks)
```

### Source Code (repository root)

```text
app/
├── _layout.tsx                    # existing: DB init + SafeAreaProvider
├── index.tsx                      # / → DashboardScreen (guards profile)
├── onboarding/index.tsx           # /onboarding → OnboardingScreen
├── pause/index.tsx                # /pause → PauseScreen
└── team/…                         # unchanged placeholders

src/modules/
├── onboarding/
│   ├── views/OnboardingScreen.tsx
│   ├── hooks/useOnboardingProfile.ts     # load/save profile, save mapper
│   ├── utils/constants.ts                # CURRENCY_OPTIONS, defaults
│   ├── utils/schema.ts                   # zod onboarding schema + types
│   └── tests/unit/schema.test.ts
├── dashboard/
│   ├── views/DashboardScreen.tsx
│   ├── hooks/useHomeMetrics.ts           # profile existence + derived metrics
│   ├── utils/metrics.ts                  # pure calculation helpers
│   └── tests/unit/metrics.test.ts
└── pause/
    ├── views/PauseScreen.tsx
    ├── hooks/usePauseFlow.ts             # timer state + save event
    ├── utils/constants.ts                # TRIGGER_OPTIONS, timer duration
    ├── utils/mappers.ts                  # buildPauseEvent
    └── tests/unit/mappers.test.ts

src/shared/
├── db/
│   ├── schema.ts                  # realign user_profile + add pause_events
│   ├── client.ts                  # existing
│   ├── queries.ts                 # profile + pause-event getters (DESC)
│   └── migrations output in ./drizzle (regenerated)
├── hooks/useDatabaseInitialized.ts
├── types/global.ts                # TriggerEmotion, DatabaseStatus
└── utils/toast.ts                 # showAppToast (validation errors)
```

**Structure Decision**: Keep the constitution-mandated layout (`src/modules/<module>`, `src/shared`)
rather than the `src/db/` path mentioned in the prompt; the constitution is the higher authority.
Home lives in the `dashboard` module; onboarding and pause keep their existing modules.

## Complexity Tracking

> No constitution violations; section intentionally empty.
