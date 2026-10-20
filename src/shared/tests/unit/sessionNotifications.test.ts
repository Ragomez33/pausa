import * as Notifications from 'expo-notifications';

import {
  cancelSessionPrompts,
  scheduleSessionPrompts,
} from '../../utils/notifications';

jest.mock('@/db/queries', () => ({
  getProfile: jest.fn(),
}));

jest.mock('expo-notifications', () => ({
  AndroidImportance: { HIGH: 4 },
  SchedulableTriggerInputTypes: { DATE: 'date' },
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  getAllScheduledNotificationsAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
}));

const mockedGetPermissions = Notifications.getPermissionsAsync as jest.Mock;
const mockedRequestPermissions = Notifications.requestPermissionsAsync as jest.Mock;
const mockedGetScheduled = Notifications.getAllScheduledNotificationsAsync as jest.Mock;
const mockedCancelScheduled = Notifications.cancelScheduledNotificationAsync as jest.Mock;
const mockedSchedule = Notifications.scheduleNotificationAsync as jest.Mock;

const startedAtMs = 1_000_000;

describe('scheduleSessionPrompts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetPermissions.mockResolvedValue({ granted: true });
    mockedRequestPermissions.mockResolvedValue({ granted: true });
    mockedGetScheduled.mockResolvedValue([
      { identifier: 'smoking-session:old:5' },
      { identifier: 'idle-reminder' },
    ]);
    mockedSchedule.mockResolvedValue('scheduled-id');
  });

  it('schedules twelve prompts with session-scoped identifiers', async () => {
    const result = await scheduleSessionPrompts({
      sessionId: 'session-1',
      startedAtMs,
      triggerEmotion: 'habit',
      nowMs: startedAtMs,
    });

    expect(result).toEqual({
      scheduled: true,
      permissionGranted: true,
      scheduledCount: 12,
      error: null,
    });
    expect(mockedSchedule).toHaveBeenCalledTimes(12);
    expect(mockedSchedule.mock.calls[0]?.[0]).toMatchObject({
      identifier: 'smoking-session:session-1:5',
      content: { title: '¿Terminaste?' },
      trigger: {
        type: 'date',
        date: new Date(startedAtMs + 5 * 60_000),
      },
    });
    expect(mockedSchedule.mock.calls[11]?.[0]).toMatchObject({
      identifier: 'smoking-session:session-1:60',
    });
  });

  it('cancels only the session prefix before scheduling', async () => {
    await scheduleSessionPrompts({
      sessionId: 'session-1',
      startedAtMs,
      triggerEmotion: 'habit',
      nowMs: startedAtMs,
    });

    expect(mockedCancelScheduled).toHaveBeenCalledTimes(1);
    expect(mockedCancelScheduled).toHaveBeenCalledWith('smoking-session:old:5');
    expect(mockedCancelScheduled).not.toHaveBeenCalledWith('idle-reminder');
  });

  it('skips past boundaries when resuming an active session', async () => {
    const result = await scheduleSessionPrompts({
      sessionId: 'session-1',
      startedAtMs,
      triggerEmotion: 'habit',
      nowMs: startedAtMs + 12 * 60_000,
    });

    expect(result.scheduledCount).toBe(10);
    expect(mockedSchedule.mock.calls[0]?.[0]).toMatchObject({
      identifier: 'smoking-session:session-1:15',
    });
  });

  it('cancels session prompts and schedules nothing when permission is denied', async () => {
    mockedGetPermissions.mockResolvedValue({ granted: false });
    mockedRequestPermissions.mockResolvedValue({ granted: false });

    const result = await scheduleSessionPrompts({
      sessionId: 'session-1',
      startedAtMs,
      triggerEmotion: 'habit',
    });

    expect(result).toEqual({
      scheduled: false,
      permissionGranted: false,
      scheduledCount: 0,
      error: null,
    });
    expect(mockedSchedule).not.toHaveBeenCalled();
    expect(mockedCancelScheduled).toHaveBeenCalledWith('smoking-session:old:5');
  });

  it('cancels only session prompts when finishing a session', async () => {
    await cancelSessionPrompts();

    expect(mockedCancelScheduled).toHaveBeenCalledTimes(1);
    expect(mockedCancelScheduled).toHaveBeenCalledWith('smoking-session:old:5');
    expect(mockedCancelScheduled).not.toHaveBeenCalledWith('idle-reminder');
  });
});
