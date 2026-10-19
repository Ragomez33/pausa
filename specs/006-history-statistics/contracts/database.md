# Contract: History Queries & Analytics

All reads go through the existing Drizzle layer at `src/db/`. Local-only; no network.

## Modules

- `src/db/queries.ts` — list + aggregate queries.
- `src/modules/history/utils/analytics.ts` — pure success/streak/breakdown calculations.
- `src/modules/history/utils/labels.ts` — row projection helpers if needed.
- `src/shared/constants/triggers.ts` + `src/shared/utils/triggers.ts` — trigger labels.
- `src/shared/utils/utils.ts` — `formatDateTime`.

## Exposed queries

```ts
export interface PauseTotals {
  total: number;
  resisted: number;
  ceded: number;
}

export interface TriggerCount {
  triggerEmotion: string;
  count: number;
}

export function listPauseEvents(): PauseEvent[];        // DESC by timestamp, then id
export function getPauseTotals(): PauseTotals;
export function listTriggerCounts(): TriggerCount[];
export function getLatestCededTimestamp(): string | null;
```

## Pure analytics

```ts
export interface TriggerBreakdown {
  triggerEmotion: string;
  label: string;
  count: number;
  percentage: number;
}

export interface PauseAnalytics {
  total: number;
  resisted: number;
  ceded: number;
  successRate: number;
  streakStart: string;
  elapsedMs: number;
  streakDays: number;
  streakHours: number;
  triggers: TriggerBreakdown[];
}

export function computeSuccessRate(resisted: number, total: number): number;
export function computeStreakStart(
  profileCreatedAt: string,
  latestCededTimestamp: string | null,
): number;
export function computeStreakParts(elapsedMs: number): { days: number; hours: number };
export function buildTriggerBreakdown(counts: TriggerCount[]): TriggerBreakdown[];
export function computePauseAnalytics(
  totals: PauseTotals,
  counts: TriggerCount[],
  profileCreatedAt: string,
  latestCededTimestamp: string | null,
  nowMs: number,
): PauseAnalytics;
```

## Requirements

- **R-HIST-1**: The list query MUST return events DESC by timestamp with `id DESC` as a deterministic tie-break (code-rules §11).
- **R-HIST-2**: Totals and trigger groups MUST be computed with database aggregation, not by loading all rows into the view layer.
- **R-HIST-3**: `getLatestCededTimestamp` MUST use `MAX(timestamp)` filtered to `resisted = 0`.
- **R-HIST-4**: Success rate MUST be resisted ÷ total × 100 and MUST NOT divide by zero.
- **R-HIST-5**: Streak start MUST be the later of profile creation and the latest ceded timestamp; elapsed MUST be clamped to `>= 0`.
- **R-HIST-6**: Trigger percentages MUST be count ÷ total × 100 and sorted by count DESC with a deterministic tie-break.
- **R-HIST-7**: Historical/unknown trigger codes MUST map to readable labels, never raw internal codes.
- **R-HIST-8**: All calculations and formatting MUST be pure and testable; no persisted analytics.
- **R-HIST-9**: A storage read failure MUST surface a clear error and MUST NOT show partial/stale analytics.
- **R-HIST-10**: No network calls, no heavy charting dependencies.

## Privacy

- Emotional triggers and notes remain local-only and MUST NOT be sent to any backend.
