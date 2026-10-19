# Contract: Home Metrics & Persistence

All reads/writes go through the existing Drizzle layer at `src/db/`. No schema change is introduced.

## Modules

- `src/modules/dashboard/utils/metrics.ts` — pure metric computation and formatting.
- `src/modules/dashboard/hooks/useHomeMetrics.ts` — profile/event loading, focus refresh, 30-second tick.
- `src/modules/pause/hooks/usePauseFlow.ts` — countdown, trigger/notes state, save guard.
- `src/modules/pause/utils/constants.ts` — trigger options and 12-second duration.
- `src/modules/pause/views/PauseScreen.tsx` — breathing visual, selector, notes, outcome actions.
- `src/db/queries.ts` — `getProfile`, `listPauseEvents`, `createPauseEvent`.

## Exposed types

```ts
export interface HomeMetrics {
  resistedCount: number;
  cededCount: number;
  elapsedMs: number;
  streakStart: string;
  avoidedCigarettes: number;
  moneySaved: number;
  currency: string;
}

export type TriggerEmotion =
  | 'anxiety'
  | 'stress'
  | 'boredom'
  | 'habit_social'
  | 'anger_frustration';

export function computeHomeMetrics(
  profile: UserProfile,
  events: PauseEvent[],
  nowMs: number,
): HomeMetrics;

export function formatElapsedDuration(elapsedMs: number): string;
```

## Metric contract

- **R-MET-1**: `streakStart` MUST be the profile creation timestamp, unless a later ceded event exists; then it is that event's timestamp.
- **R-MET-2**: `elapsedMs` MUST be `>= 0` for any input, including invalid/future timestamps.
- **R-MET-3**: `avoidedCigarettes` MUST be 0 when `dailyCigarettes <= 0`; otherwise `dailyCigarettes * elapsedMs / 86_400_000`.
- **R-MET-4**: `moneySaved` MUST be 0 when `packCost <= 0`; otherwise `(avoidedCigarettes / 20) * packCost`.
- **R-MET-5**: `resistedCount` and `cededCount` MUST be lifetime counts from all stored events (`resisted === 1` / `0`).
- **R-MET-6**: No metric may be hardcoded or persisted; every value is recomputed from the current rows and `now`.
- **R-MET-7**: Formatting helpers MUST tolerate invalid currency codes and negative/non-finite inputs.

## Persistence contract

- **R-DB-1**: New events MUST use `db.insert(pauseEvents)` through the existing `createPauseEvent` helper or an equivalent Drizzle insert.
- **R-DB-2**: A saved event MUST contain an ISO `timestamp`, a valid trigger code, `resisted` 0/1, and `notes` as text or `null`.
- **R-DB-3**: At most one event may be written per intervention session; a synchronous guard is required in addition to UI disabling.
- **R-DB-4**: Notes MUST be trimmed; empty notes MUST be stored as `null`; length is limited to 200 characters.
- **R-DB-5**: A failed insert MUST leave no partial row and MUST surface a user-visible error.
- **R-DB-6**: Historical trigger strings MUST NOT be rewritten or dropped.
- **R-DB-7**: Listing MUST remain DESC by `timestamp` (code-rules §11).
- **R-DB-8**: All data remains on-device; no network call is permitted.

## Error and empty behavior

- Missing profile → home redirects to `/onboarding`.
- Zero daily cigarettes or zero pack cost → zero derived values, no division errors.
- Storage read failure → dashboard error state with a clear message.
- Save failure → stay on intervention, show a toast, allow retry.
