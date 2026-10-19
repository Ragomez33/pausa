# Implementation Plan: History & Statistics

**Branch**: `006-history-statistics` | **Date**: 2026-10-19 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/006-history-statistics/spec.md`

## Summary

Add a dedicated `/history` screen that lists pause events newest-first with localized date/time, readable trigger labels, resisted/ceded status, and optional notes. Show aggregated statistics above the list: overall success rate, active smoke-free streak in days/hours, and a lightweight trigger-frequency breakdown. Totals, trigger groups, and the latest ceded timestamp come from small Drizzle aggregation queries; all derived percentages and streak math are pure client-side functions. No schema change and no heavy chart dependency.

## Technical Context

**Language/Version**: TypeScript 5.9 (`strict: true`), React Native 0.81, Expo SDK 54

**Primary Dependencies**: Expo Router v6; NativeWind v4 + Tailwind CSS 3.4; Drizzle ORM 0.45 + expo-sqlite 16. No new dependencies.

**Storage**: Existing local SQLite `pausa.db` through `src/db/`. Reads `pause_events` and `user_profile`; new aggregate query helpers. No migration.

**Testing**: Jest (`jest-expo`). Unit tests for success rate, streak start/duration, trigger breakdown ordering/percentages, trigger label mapping (current/legacy/unknown), and date-time formatting. Device validation via `quickstart.md`.

**Target Platform**: Mobile (iOS/Android), Expo managed.

**Project Type**: mobile-app (single frontend project; no backend).

**Performance Goals**: Aggregate queries return tiny result sets; the list virtualizes rows via `FlatList`; 1,000-event histories open within 2 seconds and scroll smoothly.

**Constraints**: Local-only (0 network calls); all analytics derived on demand; strict typing (no `any`/`unknown`); no heavy chart libraries; thin routes; current and legacy trigger codes must render readable labels; no persisted analytics.

**Scale/Scope**: 1 new screen; 1 new module; 2 read-only tables; 4 new aggregate/list query helpers; 3 statistic sections; single local user.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Constitution / code-rules reference | Status |
|------|--------------------------------------|--------|
| Source under `src/`; `app/` thin routing only | Constitution §1.1/§1.2, code-rules §9 | PASS — new module + thin `/history` route |
| Domain storage only via Drizzle/SQLite | Constitution §3, code-rules §11/§12 | PASS — all reads through `src/db` |
| Local-first privacy | Constitution §3, code-rules §12 | PASS — triggers/notes never leave device |
| Strict typing, no `any`/`unknown` | code-rules §1 | PASS — explicit query/analytics/row types |
| UI strictly NativeWind + RN primitives | code-rules §4 | PASS — cards, bars, `FlatList` |
| Constants out of components | code-rules §5 | PASS — labels/status copy in constants/shared |
| Form state consolidated | code-rules §6 | N/A — no forms in this feature |
| Validation via Zod + toasts | code-rules §3/§7 | N/A — read-only feature; errors use the screen error state |
| Atomic try/catch + pure helpers | code-rules §8 | PASS — queries isolated; analytics pure |
| DESC ordering for historical getters | code-rules §11 | PASS — timestamp DESC + id DESC tie-break |
| Aggregation over full-table JS scans | Feature FR-017 / request item 3 | PASS — totals, groups, latest ceded |
| No heavy chart dependency | Feature FR-016 | PASS — native bars only |
| Specs in EARS | Constitution §4 | PASS |

**Result**: No violations. No Complexity Tracking entries required.

**Post-Design Re-evaluation (after Phase 1)**: PASS — the data model keeps analytics derived, the contracts enforce aggregate queries and deterministic ordering, and the UI uses virtualization and native bars. No new violations.

## Project Structure

### Documentation (this feature)

```text
specs/006-history-statistics/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 decisions
├── data-model.md        # Read-only entities + derived analytics
├── quickstart.md        # Phase 1 validation guide
├── contracts/
│   ├── database.md      # Query + analytics contract
│   └── routes.md        # History route/screen contract
└── checklists/
    └── requirements.md  # Spec quality checklist
```

### Source Code (repository root)

```text
app/
├── _layout.tsx                     # register history Stack screen
├── index.tsx                       # unchanged thin route
└── history/index.tsx               # NEW /history → HistoryScreen

src/
├── db/
│   └── queries.ts                  # listPauseEvents tie-break + aggregate helpers
├── modules/
│   ├── history/                    # NEW module
│   │   ├── views/HistoryScreen.tsx
│   │   ├── hooks/useHistory.ts
│   │   ├── utils/analytics.ts      # success rate, streak, trigger breakdown
│   │   ├── utils/constants.ts      # status labels / empty copy
│   │   ├── utils/mappers.ts        # HistoryEntry projection
│   │   └── tests/unit/{analytics,mappers}.test.ts
│   └── dashboard/
│       └── views/DashboardScreen.tsx   # + "Historial" action
└── shared/
    ├── constants/triggers.ts       # current + legacy trigger labels
    ├── utils/triggers.ts           # getTriggerLabel fallback
    ├── utils/utils.ts              # + formatDateTime
    └── tests/unit/{triggers,utils}.test.ts
```

**Structure Decision**: Keep the constitution's module layout. History analytics live in `src/modules/history/utils`, while trigger labels and date formatting are shared because they describe domain-wide values used by multiple screens. The route stays thin. No database migration is required.

## Implementation Notes

1. **Queries**: Update `listPauseEvents()` to `ORDER BY timestamp DESC, id DESC`. Add `getPauseTotals()` using `count()` plus conditional sums, `listTriggerCounts()` using `GROUP BY trigger_emotion`, and `getLatestCededTimestamp()` using `MAX(timestamp) WHERE resisted = 0`.
2. **Analytics**: Pure helpers compute success rate (`resisted/total*100`, zero-safe), streak start (later of profile creation and latest ceded), elapsed clamp, days/hours, and trigger breakdown (count and percentage, count DESC then label).
3. **Labels**: `TRIGGER_LABELS` covers the current five plus `work_stress`, `coffee_social`, and `other`; `getTriggerLabel` title-cases unknown codes and never exposes raw underscores.
4. **Formatting**: `formatDateTime(iso)` uses the device locale/time zone and returns the raw value when invalid.
5. **Hook**: `useHistory` loads events and aggregates on focus, exposes `{ loading, hasProfile, events, analytics, error, refresh }`, and redirects missing profiles.
6. **Screen**: `FlatList` with `ListHeaderComponent` for the stats and trigger breakdown; memoized row component; stable `keyExtractor` by id; empty/loading/error states.
7. **Visuals**: Cards for success rate and streak; trigger rows with labels, counts, percentages, and proportional bars using NativeWind plus a justified inline width style.
8. **Home**: Add a "Historial" action next to the existing inventory action, preserving current metrics and Pausa behavior.
9. **Tests**: Cover all pure analytics, label mapping (current/legacy/unknown), and date formatting; existing metric tests remain green.

## Complexity Tracking

> No constitution violations; section intentionally empty.
