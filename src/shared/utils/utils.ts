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

export function formatElapsedDuration(elapsedMs: number): string {
  const safeMs = Number.isFinite(elapsedMs) ? Math.max(0, elapsedMs) : 0;
  const totalMinutes = Math.floor(safeMs / 60_000);

  if (totalMinutes <= 0) {
    return '0m';
  }

  const days = Math.floor(totalMinutes / 1_440);
  const hours = Math.floor((totalMinutes % 1_440) / 60);
  const minutes = totalMinutes % 60;
  const parts: string[] = [];

  if (days > 0) {
    parts.push(`${days}d`);
  }
  if (hours > 0) {
    parts.push(`${hours}h`);
  }
  if (minutes > 0) {
    parts.push(`${minutes}m`);
  }

  return parts.join(' ');
}
