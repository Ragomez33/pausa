import type { NewSmokingEvent } from '@/db/schema';
import type { SmokingTrigger } from '@/shared/constants/smoking';

export function formatDuration(totalSeconds: number): string {
  const safeSeconds = Number.isFinite(totalSeconds) ? Math.max(0, Math.floor(totalSeconds)) : 0;
  const hours = Math.floor(safeSeconds / 3_600);
  const minutes = Math.floor((safeSeconds % 3_600) / 60);
  const seconds = safeSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function nextPromptBoundary(elapsedSeconds: number): number {
  const safe = Number.isFinite(elapsedSeconds)
    ? Math.max(0, Math.floor(elapsedSeconds))
    : 0;
  return (Math.floor(safe / 300) + 1) * 300;
}

export interface SmokingEventInput {
  nowMs: number;
  triggerEmotion: SmokingTrigger;
  durationSeconds: number;
  inventoryDecremented: boolean;
}

export function buildSmokingEvent(input: SmokingEventInput): NewSmokingEvent {
  return {
    timestamp: new Date(input.nowMs).toISOString(),
    triggerEmotion: input.triggerEmotion,
    durationSeconds: Math.max(1, Math.floor(input.durationSeconds)),
    inventoryDecremented: input.inventoryDecremented ? 1 : 0,
  };
}
