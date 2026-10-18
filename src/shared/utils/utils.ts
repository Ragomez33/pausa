export function formatTimeRemaining(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString();
}

export function calculateSupplyDuration(
  remainingCigarettes: number,
  dailyTarget: number,
): number | null {
  if (dailyTarget <= 0) {
    return null;
  }
  return Math.floor(remainingCigarettes / dailyTarget);
}
