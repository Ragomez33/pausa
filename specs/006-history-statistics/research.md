# Phase 0 Research: History & Statistics

Format per decision: **Decision / Rationale / Alternatives considered**.

## R1. History scope

- **Decision**: The history screen covers `pause_events` only. Inventory consumption remains in the inventory module.
- **Rationale**: All detailed requirements reference pause events; merging inventory movements would add a second data shape and navigation scope not requested by the acceptance scenarios. The spec Clarification Gate recommends this default.
- **Alternatives considered**: A combined pause + inventory timeline (mixed units, more complex contracts); inventory-only tab (does not satisfy the pause history requirements).

## R2. Event list and ordering

- **Decision**: Reuse `listPauseEvents()` with `ORDER BY timestamp DESC` and add `id DESC` as a deterministic tie-break for identical timestamps. Render with a `FlatList` using the stats panel as `ListHeaderComponent` and a memoized row component.
- **Rationale**: The query already exists and is indexed by timestamp. Stable ordering satisfies the duplicate-timestamp edge case. `FlatList` virtualization keeps long histories smooth without rendering every row at once.
- **Alternatives considered**: Rendering with `ScrollView` + `.map` (poor memory behavior for long lists); sorting in the component (forbidden by code-rules §11); client-side pagination (unnecessary for expected volumes and adds UI complexity).

## R3. Aggregated statistics queries

- **Decision**: Add small Drizzle aggregation queries in `src/db/queries.ts`:
  - `getPauseTotals()` → `{ total, resisted, ceded }` using `count()` and conditional `sum(case when ...)`.
  - `listTriggerCounts()` → grouped counts by `trigger_emotion` using `groupBy`.
  - `getLatestCededTimestamp()` → `max(timestamp)` where `resisted = 0`.
  The list query remains separate for the FlatList.
- **Rationale**: Satisfies the explicit requirement to use aggregation functions and avoids loading the full event table into JS just to compute totals or trigger groups. Each aggregate returns a tiny result set.
- **Alternatives considered**: Computing totals from the already-loaded event array (simpler but does not meet the aggregation requirement and scales less well); one giant SQL statement returning both totals and groups (harder to type and test).

## R4. Success rate

- **Decision**: `successRate = total > 0 ? (resisted / total) * 100 : 0`. The UI shows a neutral "Sin datos" state when `total === 0` rather than dividing by zero.
- **Rationale**: Matches FR-008/FR-009 and the zero-event edge case. The numeric value stays deterministic for tests.
- **Alternatives considered**: `null` success rate (extra branching everywhere); rounding in the calculation (keep full precision, round only for display).

## R5. Active streak

- **Decision**: Start at `user_profile.created_at`, or at `getLatestCededTimestamp()` when that value is later. Compute `elapsedMs = max(0, now - startMs)`, then `days = floor(elapsed / 86_400_000)` and `hours = floor((elapsed % 86_400_000) / 3_600_000)`. Display as `Nd Nh` (or `Nh` when zero days).
- **Rationale**: Mirrors the Home streak definition, keeps history and home consistent, and clamps clock skew to zero (FR-022). Aggregate `max(timestamp)` avoids loading all events for the streak start.
- **Alternatives considered**: Counting consecutive resisted events (different semantic, contradicts "days/hours without smoking"); deriving from the full event list in JS (unnecessary memory).

## R6. Trigger labels and legacy codes

- **Decision**: Add `src/shared/constants/triggers.ts` with labels for the current five codes plus legacy `work_stress`, `coffee_social`, and `other`. Add `getTriggerLabel(code)` in `src/shared/utils/triggers.ts` that falls back to a title-cased version of unknown codes.
- **Rationale**: Historical events remain readable without rewriting stored data. Centralizing labels avoids duplicating the mapping in history and pause modules.
- **Alternatives considered**: A migration that rewrites old codes (destructive and unnecessary); showing raw codes (fails FR-015); a history-only mapping (future duplication).

## R7. Statistics UI without chart libraries

- **Decision**: Render success rate and streak as cards; render trigger breakdown as rows with a label, count, percentage, and a horizontal bar whose width is a percentage of the maximum count. Use NativeWind for layout/colors and a minimal inline `style` for the dynamic width only.
- **Rationale**: Satisfies FR-016 and the no-heavy-chart restriction. Inline width is a justified exception because the value is dynamic; all static styling remains utility-based.
- **Alternatives considered**: `react-native-svg` bars (available but unnecessary); external chart libraries (explicitly discouraged); fixed-width bars without percentages (does not show proportions).

## R8. Route and Home entry point

- **Decision**: Add `app/history/index.tsx` rendering `HistoryScreen`, register it in the root `Stack`, and add a "Historial" action on Home next to the existing inventory action.
- **Rationale**: Follows the resource-folder route convention and the thin-router rule. Home is the natural entry point.
- **Alternatives considered**: Loose `app/history.tsx` (collides with the resource-folder convention); embedding history into Home (too much content).

## R9. Refresh, empty, and error states

- **Decision**: Load history and aggregates with `useFocusEffect` on every focus. Show a full-screen loading indicator, a clear error state on storage failure, and explicit empty states for the list, success rate, and trigger breakdown. Missing profile redirects to onboarding.
- **Rationale**: Satisfies FR-007/FR-018/FR-019/FR-020 and keeps data fresh after new pause events.
- **Alternatives considered**: Load once on mount (stale after recording an impulse); global store (unnecessary).

## R10. Date/time formatting

- **Decision**: Add `formatDateTime(iso: string)` to `src/shared/utils/utils.ts`, using the device locale/time zone and falling back to the raw value for invalid timestamps.
- **Rationale**: History rows need localized date and time; the helper is general-purpose and testable.
- **Alternatives considered**: Formatting inside the row component (repeated work); hardcoded format (ignores locale).

## R11. Testing strategy

- **Decision**: Unit-test the pure analytics helpers (success rate, streak start/duration, trigger breakdown ordering/percentages), trigger label mapping including legacy/unknown codes, and date formatting. Aggregation queries are exercised through the device quickstart because native SQLite is unavailable in Jest.
- **Rationale**: All business math is deterministic and pure; native query behavior is covered by manual validation and the existing database layer.
- **Alternatives considered**: Mocking Drizzle in Jest (brittle, low value); skipping tests (violates constitution §5.6).

## Resolved unknowns

All Technical Context fields are resolved; no `NEEDS CLARIFICATION` markers remain. Spec Clarification Gates are resolved by R1 (consumption scope), R5 (streak definition), and R3/R7 (trigger breakdown coverage and presentation).
