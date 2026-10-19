export interface PickedMessage {
  index: number;
  message: string;
}

export function pickMessage(
  messages: readonly string[],
  previousIndex?: number,
): PickedMessage {
  if (messages.length === 0) {
    return { index: -1, message: '' };
  }
  if (messages.length === 1) {
    return { index: 0, message: messages[0] };
  }

  const candidates = messages
    .map((_, index) => index)
    .filter((index) => index !== previousIndex);
  const pickedIndex = candidates[Math.floor(Math.random() * candidates.length)] ?? 0;

  return { index: pickedIndex, message: messages[pickedIndex] };
}
