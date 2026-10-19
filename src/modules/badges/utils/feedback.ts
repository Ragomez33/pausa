import type { BadgeDefinition } from '../utils/catalog';

export function formatUnlockMessage(newBadges: BadgeDefinition[]): string | null {
  if (newBadges.length === 0) {
    return null;
  }
  if (newBadges.length === 1) {
    return newBadges[0].title;
  }
  return newBadges.map((badge) => badge.title).join(', ');
}
