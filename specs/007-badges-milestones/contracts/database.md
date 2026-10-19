# Contract: Badge Persistence & Evaluation

All reads/writes go through the existing Drizzle layer at `src/db/`. Local-only; no network.

## Modules

- `src/db/schema.ts` — `userBadges` table + inferred types.
- `src/db/queries.ts` — `listUserBadges`, `unlockBadges`.
- `src/modules/badges/utils/catalog.ts` — static six-badge catalog.
- `src/modules/badges/utils/evaluate.ts` — pure state/progress/eligibility logic.
- `src/modules/badges/utils/service.ts` — read state, evaluate, persist missing unlocks.
- `src/modules/badges/hooks/useBadgeEvaluation.ts` — Home focus evaluation + toast.
- `src/modules/badges/hooks/useBadges.ts` — badges screen load/evaluation.
- `src/modules/badges/views/BadgesScreen.tsx`.

## Schema

`user_badges`

| DB column | Type | Null | Notes |
|-----------|------|------|-------|
| `id` | integer | no | PK, autoincrement |
| `badge_key` | text | no | Unique |
| `unlocked_at` | text ISO | no | First unlock moment |

## Exposed operations

```ts
export function listUserBadges(): UserBadge[];                 // DESC by unlocked_at
export function unlockBadges(
  entries: { badgeKey: string; unlockedAt: string }[],
): void;                                                      // idempotent batch insert

export interface BadgeState {
  resistedPauses: number;
  streakDays: number;
  moneySaved: number;
}

export interface BadgeStatus {
  definition: BadgeDefinition;
  unlocked: boolean;
  unlockedAt?: string;
  progressValue: number;
  progressPercent: number;
}

export function evaluateBadges(
  state: BadgeState,
  unlockedKeys: string[],
): { statuses: BadgeStatus[]; newKeys: string[] };

export function evaluateAndUnlockBadges(nowMs: number): {
  newBadges: BadgeDefinition[];
  error: Error | null;
};
```

## Requirements

- **R-BADGE-1**: Every unlock MUST have a unique `badge_key`; duplicates are ignored without changing the original `unlocked_at`.
- **R-BADGE-2**: `unlockBadges` MUST be a no-op for an empty list and MUST insert missing keys in one batch with the same ISO timestamp.
- **R-BADGE-3**: Eligibility MUST use the static catalog and the current derived state only.
- **R-BADGE-4**: Streak days and money saved MUST reuse the shared derived-metric helpers so Home, History, and badges agree.
- **R-BADGE-5**: Progress MUST be clamped to `[0, target]` and `[0, 100]%`.
- **R-BADGE-6**: Unlocked records MUST never be deleted or re-timestamped.
- **R-BADGE-7**: Unknown stored keys MUST be ignored by the UI.
- **R-BADGE-8**: Evaluation MUST be idempotent and safe to run on every focus.
- **R-BADGE-9**: Evaluation failures MUST return an error without partial UI unlocks; existing records stay intact.
- **R-BADGE-10**: All processing is local; no network calls.

## Privacy

- Badge state and unlock times remain local-only and MUST NOT be synchronized.
