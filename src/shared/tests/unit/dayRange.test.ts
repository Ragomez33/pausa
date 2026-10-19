import { getLocalDayRange } from '../../utils/dayRange';

describe('getLocalDayRange', () => {
  it('returns local midnight boundaries that contain the given moment', () => {
    const now = new Date(2026, 9, 19, 15, 30, 0, 0).getTime();
    const range = getLocalDayRange(now);

    const start = new Date(range.startIso).getTime();
    const end = new Date(range.endIso).getTime();

    expect(start).toBeLessThan(now);
    expect(end).toBeGreaterThanOrEqual(now);
    expect(new Date(start).getHours()).toBe(0);
    expect(new Date(start).getMinutes()).toBe(0);
  });

  it('works exactly at local midnight', () => {
    const now = new Date(2026, 9, 19, 0, 0, 0, 0).getTime();
    const range = getLocalDayRange(now);

    expect(new Date(range.startIso).getTime()).toBe(now);
    expect(new Date(range.endIso).getTime()).toBeGreaterThan(now);
  });
});
