export interface LocalDayRange {
  startIso: string;
  endIso: string;
}

export function getLocalDayRange(nowMs: number): LocalDayRange {
  const now = new Date(nowMs);
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);

  return {
    startIso: start.toISOString(),
    endIso: new Date(end.getTime() - 1).toISOString(),
  };
}
