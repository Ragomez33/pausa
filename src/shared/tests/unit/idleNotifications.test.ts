import * as Notifications from 'expo-notifications';

import { getLatestHabitInteractionAtMs, getProfile } from '@/db/queries';
import { IDLE_NOTIFICATION_DATA_TYPE, IDLE_NOTIFICATION_ID } from '@/shared/constants/notifications';

import {
  ensureIdleNotificationFromProfile,
  scheduleIdleNotification,
} from '../../utils/notifications';

jest.mock('@/db/queries', () => ({
  getProfile: jest.fn(),
  getLatestHabitInteractionAtMs: jest.fn(),
}));

jest.mock('expo-notifications', () => ({
  AndroidImportance: { HIGH: 4 },
  SchedulableTriggerInputTypes: { DATE: 'date', TIME_INTERVAL: 'timeInterval' },
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  getAllScheduledNotificationsAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
}));

const mockedGetProfile = getProfile as jest.Mock;
const mockedGetLatestInteraction = getLatestHabitInteractionAtMs as jest.Mock;
const mockedGetPermissions = Notifications.getPermissionsAsync as jest.Mock;
const mockedRequestPermissions = Notifications.requestPermissionsAsync as jest.Mock;
const mockedGetScheduled = Notifications.getAllScheduledNotificationsAsync as jest.Mock;
const mockedSchedule = Notifications.scheduleNotificationAsync as jest.Mock;

const nowMs = 10_000_000;
const intervalMs = 48 * 60_000;

describe('scheduleIdleNotification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetPermissions.mockResolvedValue({ granted: true });
    mockedRequestPermissions.mockResolvedValue({ granted: true });
    mockedGetScheduled.mockResolvedValue([]);
    mockedSchedule.mockResolvedValue('scheduled-id');
  });

  it('anchors the date trigger to the last real interaction', async () => {
    const lastInteractionAtMs = nowMs - 10 * 60_000;

    const result = await scheduleIdleNotification({
      dailyCigarettes: 20,
      lastInteractionAtMs,
      nowMs,
    });

    expect(result).toEqual({ scheduled: true, permissionGranted: true, error: null });
    expect(mockedSchedule).toHaveBeenCalledTimes(1);
    expect(mockedSchedule.mock.calls[0]?.[0]).toMatchObject({
      identifier: IDLE_NOTIFICATION_ID,
      content: { data: { type: IDLE_NOTIFICATION_DATA_TYPE } },
      trigger: { type: 'date' },
    });
    const scheduledRequest = mockedSchedule.mock.calls[0]?.[0] as {
      trigger: { date: Date };
    };
    expect(scheduledRequest.trigger.date.getTime()).toBe(lastInteractionAtMs + intervalMs);
  });

  it('starts a new interval when the anchored target already passed', async () => {
    await scheduleIdleNotification({
      dailyCigarettes: 20,
      lastInteractionAtMs: nowMs - 3 * 60 * 60_000,
      nowMs,
    });

    const scheduledRequest = mockedSchedule.mock.calls[0]?.[0] as {
      trigger: { date: Date };
    };
    expect(scheduledRequest.trigger.date.getTime()).toBe(nowMs + intervalMs);
  });
});

describe('ensureIdleNotificationFromProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetPermissions.mockResolvedValue({ granted: true });
    mockedRequestPermissions.mockResolvedValue({ granted: true });
    mockedSchedule.mockResolvedValue('scheduled-id');
    mockedGetProfile.mockReturnValue({ dailyCigarettes: 20 });
    mockedGetLatestInteraction.mockReturnValue(nowMs - 5 * 60_000);
  });

  it('does not touch an already pending reminder', async () => {
    mockedGetScheduled.mockResolvedValue([{ identifier: IDLE_NOTIFICATION_ID }]);

    const result = await ensureIdleNotificationFromProfile(nowMs);

    expect(result).toEqual({ scheduled: false, permissionGranted: true, error: null });
    expect(mockedSchedule).not.toHaveBeenCalled();
    expect(mockedGetLatestInteraction).not.toHaveBeenCalled();
  });

  it('re-arms a missing reminder from the latest interaction', async () => {
    mockedGetScheduled.mockResolvedValue([]);

    const result = await ensureIdleNotificationFromProfile(nowMs);

    expect(result.scheduled).toBe(true);
    expect(mockedSchedule).toHaveBeenCalledTimes(1);
    const scheduledRequest = mockedSchedule.mock.calls[0]?.[0] as {
      trigger: { date: Date };
    };
    expect(scheduledRequest.trigger.date.getTime()).toBe(nowMs - 5 * 60_000 + intervalMs);
  });
});
