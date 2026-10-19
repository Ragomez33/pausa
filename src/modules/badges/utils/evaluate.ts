import { BADGE_CATALOG, type BadgeConditionType, type BadgeDefinition } from './catalog';

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

function getCurrentValue(state: BadgeState, conditionType: BadgeConditionType): number {
  if (conditionType === 'resistedPauses') {
    return state.resistedPauses;
  }
  if (conditionType === 'streakDays') {
    return state.streakDays;
  }
  return state.moneySaved;
}

export function evaluateBadges(
  state: BadgeState,
  unlockedKeys: string[],
): { statuses: BadgeStatus[]; newKeys: string[] } {
  const unlocked = new Set(unlockedKeys);
  const newKeys: string[] = [];

  const statuses = BADGE_CATALOG.map((definition) => {
    const rawValue = getCurrentValue(state, definition.conditionType);
    const safeValue = Number.isFinite(rawValue) ? Math.max(0, rawValue) : 0;
    const isUnlocked = unlocked.has(definition.key);

    if (!isUnlocked && safeValue >= definition.target) {
      newKeys.push(definition.key);
    }

    return {
      definition,
      unlocked: isUnlocked,
      progressValue: Math.min(safeValue, definition.target),
      progressPercent:
        definition.target > 0
          ? Math.min(100, Math.max(0, (safeValue / definition.target) * 100))
          : 0,
    };
  });

  return { statuses, newKeys };
}
