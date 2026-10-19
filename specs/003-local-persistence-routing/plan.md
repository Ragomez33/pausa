# Implementation Plan: Local Persistence & Startup Routing

**Branch**: `003-local-persistence-routing` | **Date**: 2026-10-19 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-local-persistence-routing/spec.md`

## Summary

Establish the local-first persistence layer at `src/db/` using Drizzle ORM over `expo-sqlite`, with
`user_profile` and `pause_events` in the exact requested shapes. Add a startup hook that prepares the
schema idempotently, detects whether a profile exists, and exposes `{ ready, hasProfile, error }`.
Integrate that hook into the root layout so the app shows a loading indicator during setup, redirects to
`/onboarding` when no profile exists, and opens home otherwise. Wire the onboarding form to validate
numeric input and insert a single profile before replacing to `/`, preserving existing records through a
verified migration.

## Technical Context

**Language/Version**: TypeScript 5.9 (`strict: true`), React Native 0.81, Expo SDK 54

**Primary Dependencies**: `drizzle-orm` 0.45 + `expo-sqlite` 16, Expo Router v6, Zod v4,
NativeWind v4 + Tailwind CSS 3.4, `react-native-safe-area-context`. No new runtime dependencies.

**Storage**: Local SQLite `pausa.db` via `openDatabaseSync`; single Drizzle instance at `src/db/`.
Timestamps stored as ISO-8601 UTC text. Versioned migrations in `drizzle/` plus an idempotent
`CREATE TABLE IF NOT EXISTS` bootstrap fallback.

**Testing**: Jest (`jest-expo`). Unit tests for the schema types, onboarding mapper/validation, ISO
timestamp conversion, pause-event mapper, and unchanged metric calculations. End-to-end checks are
manual on a simulator/device per `quickstart.md` (native SQLite is not available in the Jest preset).

**Target Platform**: Mobile (iOS/Android), Expo managed.

**Project Type**: mobile-app (single frontend project; no backend in this feature).

**Performance Goals**: Loading indicator visible on the first frame; schema setup + profile detection
complete and first actionable screen shown within 2 seconds on a typical device. All queries run after
mount; no storage call on the render path.

**Constraints**: Local-only (0 network calls); one profile maximum; strict typing (no `any`/`unknown`);
no inline field validation (toasts only); thin Expo Router routes; Drizzle/SQLite only for domain data;
historical pause-event reads descending by timestamp.

**Scale/Scope**: 2 tables, 1 profile row, 3 route files touched (`_layout`, onboarding route stays thin),
2 module hooks touched, ~4 trigger options, single-user local data.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Constitution / code-rules reference | Status |
|------|--------------------------------------|--------|
| Source under `src/`; `app/` thin routing only | Constitution §1.1/§1.2, code-rules §9 | PASS — DB in `src/db/`, routes import views only |
| Domain storage only via Drizzle/SQLite | Constitution §3, code-rules §11/§12 | PASS — no AsyncStorage, no network |
| Local-first privacy (emotional triggers local) | Constitution §3, code-rules §12 | PASS — triggers/notes never leave the device |
| Strict typing, no `any`/`unknown` | code-rules §1 | PASS — explicit interfaces + inferred Drizzle types |
| UI strictly NativeWind + RN primitives | code-rules §4 | PASS — existing loading/error views |
| Constants out of components | code-rules §5 | PASS — defaults remain in module constants |
| Form state consolidated (≤3 `useState`) | code-rules §6 | PASS — onboarding keeps one form object |
| Validation via zod + toasts, no inline errors | code-rules §3/§7 | PASS — `showAppToast` on failure |
| Atomic try/catch + pure mappers | code-rules §8 | PASS — try blocks limited to storage calls |
| DESC ordering for historical getters | code-rules §11 | PASS — `pause_events` ordered by `timestamp` DESC |
| Idempotent startup initialization | Constitution §3, FR-004/FR-012 | PASS — migrations + bootstrap fallback |
| Specs in EARS | Constitution §4 | PASS |

**Path decision note**: The feature explicitly requires `src/db/`. Constitution §1.1 mandates source
under `src/` but does not enumerate a database folder, and §1.2 governs module business/presentation
logic rather than cross-cutting storage infrastructure. This supersedes the earlier `src/shared/db/`
choice from feature 002; keeping a single Drizzle instance avoids schema drift.

**Result**: No violations. No Complexity Tracking entries required.

**Post-Design Re-evaluation (after Phase 1)**: PASS — `data-model.md`, `contracts/database.md`, and
`contracts/routes.md` preserve every gate. The migration converts legacy records instead of deleting
them, ISO text timestamps preserve DESC ordering, startup redirects are owned by the root layout, and
all storage access remains inside `src/db/` or async effects/handlers. No new violations.

## Project Structure

### Documentation (this feature)

```text
specs/003-local-persistence-routing/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 decisions
├── data-model.md        # Phase 1 schema + migration mapping
├── quickstart.md        # Phase 1 validation guide
├── contracts/
│   ├── database.md      # Persistence contract
│   └── routes.md        # Startup/navigation contract
└── checklists/
    └── requirements.md  # Spec quality checklist
```

### Source Code (repository root)

```text
app/
├── _layout.tsx                   # Add hasProfile-aware startup routing + loading/error states
├── index.tsx                     # / → DashboardScreen (unchanged thin route)
├── onboarding/index.tsx          # /onboarding → OnboardingScreen (unchanged thin route)
├── pause/index.tsx               # /pause → PauseScreen (unchanged thin route)
└── team/…                        # unchanged

src/
├── db/                           # NEW canonical persistence layer (moved from src/shared/db)
│   ├── schema.ts                 # userProfile + pauseEvents in requested shapes
│   ├── client.ts                 # openDatabaseSync('pausa.db') + drizzle instance
│   ├── queries.ts                # getProfile/saveProfile/listPauseEvents/createPauseEvent
│   └── mappers.ts                # moved pure entity builders
├── shared/
│   ├── hooks/useDatabaseInitialized.ts   # ready/hasProfile/error + schema setup
│   ├── types/global.ts                   # DatabaseStatus extended with hasProfile
│   ├── constants/app.ts                  # default goal/currency constants
│   └── utils/toast.ts                    # unchanged centralized notifications
└── modules/
    ├── onboarding/
    │   ├── views/OnboardingScreen.tsx    # await async submit, then replace('/')
    │   ├── hooks/useOnboardingProfile.ts # validate + single-profile guard + db.insert
    │   └── utils/{schema,mappers,constants}.ts  # ISO createdAt, required goal handling
    ├── pause/
    │   ├── hooks/usePauseFlow.ts         # update import path; ISO timestamp via mapper
    │   └── utils/mappers.ts              # timestamp: ISO string, resisted: 0/1
    └── dashboard/
        ├── hooks/useHomeMetrics.ts       # update import path
        └── utils/metrics.ts              # update types; logic unchanged

drizzle/
├── 0002_<name>.sql               # Verified migration: ISO text timestamps + requested columns
└── meta/_journal.json            # Updated journal entry

src/shared/db/                    # REMOVED after import migration (no duplicate client)
```

**Structure Decision**: Single mobile project. Persistence is consolidated at `src/db/` because the
feature explicitly requires it and a single local database serves all modules. Route files remain thin
and delegate to module views; startup decisions live in the root layout and the shared hook. The old
`src/shared/db/` directory is deleted after every consumer import is migrated, so only one Drizzle
instance and one schema source exist.

## Implementation Notes

1. **Schema/client**: `openDatabaseSync(DATABASE_NAME)` and `drizzle(expoDatabase, { schema })` are
   created once at module load (explicit requirement). Drizzle columns use camelCase TypeScript keys
   mapped to snake_case DB names, with `created_at`/`timestamp` typed as text.
2. **Startup hook**: apply versioned migrations, then run `CREATE TABLE IF NOT EXISTS` bootstrap SQL via
   `execAsync` as a safety net; if both fail, return the error. Query `user_profile` for at least one row
   and set `{ ready, hasProfile, error }` after mount. Cleanup guard prevents state updates after unmount.
3. **Layout**: render loading until `ready`; on error render a clear message; once ready, redirect to
   `/onboarding` only when `hasProfile` is false and the current segment is not `onboarding`. The Stack is
   rendered otherwise. No unconditional `Redirect`, so onboarding does not loop.
4. **Onboarding**: `submit` becomes async, revalidates with zod, checks for an existing profile, maps to
   the exact insert payload (`dailyCigarettes`, `packCost`, `currency`, `quitGoal`, `createdAt` ISO), and
   calls `db.insert(userProfile).values(...)`. On success the screen replaces to `/`; on failure it
   shows a toast and keeps the form. Repeated taps are blocked by the `submitting` flag plus the
   existence guard.
5. **Migration**: hand-verify the generated `0002` SQL preserves row counts and primary keys while
   converting epoch-millisecond integers to ISO text and dropping unused scaffold columns. Existing
   smoke-log and supply tables are untouched.
6. **Docs/tests**: update unit tests for the ISO mappers and any moved import paths. Native migration and
   routing behavior are validated through `quickstart.md`.

## Complexity Tracking

> No constitution violations; section intentionally empty.
