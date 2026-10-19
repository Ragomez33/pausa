import { CIGARETTES_PER_PACK } from '@/shared/constants/app';
import type { PauseEvent, UserProfile } from '@/db/schema';
import type { HomeMetrics } from '@/shared/types/global';

export function countResisted(events: PauseEvent[]): number {
  return events.filter((event) => event.resisted === 1).length;
}

export function currentStreak(events: PauseEvent[]): number {
  let streak = 0;
  for (const event of events) {
    if (event.resisted !== 1) {
      break;
    }
    streak += 1;
  }
  return streak;
}

export function calculateMoneySaved(resistedCount: number, packCost: number): number {
  if (packCost <= 0 || resistedCount <= 0) {
    return 0;
  }
  return (resistedCount * packCost) / CIGARETTES_PER_PACK;
}

export function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

export function computeHomeMetrics(
  profile: UserProfile,
  events: PauseEvent[],
): HomeMetrics {
  const resistedCount = countResisted(events);
  return {
    resistedCount,
    currentStreak: currentStreak(events),
    moneySaved: calculateMoneySaved(resistedCount, profile.packCost),
    currency: profile.currency,
  };
}
