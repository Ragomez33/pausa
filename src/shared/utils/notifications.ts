import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import { getProfile } from '@/db/queries';
import {
  IDLE_NOTIFICATION_BODY,
  IDLE_NOTIFICATION_CHANNEL_ID,
  IDLE_NOTIFICATION_TITLE,
} from '@/shared/constants/notifications';

import { computeIdleSchedule } from './reminderSchedule';

export interface IdleScheduleResult {
  scheduled: boolean;
  permissionGranted: boolean;
  error: Error | null;
}

let schedulingQueue: Promise<unknown> = Promise.resolve();

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const run = schedulingQueue.then(task, task);
  schedulingQueue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

function toError(caught: unknown): Error {
  return caught instanceof Error
    ? caught
    : new Error('No se pudo programar el recordatorio.');
}

async function cancelScheduled(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export function configureNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

export async function requestNotificationPermissions(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) {
    return true;
  }
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

async function configureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }
  await Notifications.setNotificationChannelAsync(IDLE_NOTIFICATION_CHANNEL_ID, {
    name: 'Recordatorios de inactividad',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    sound: 'default',
  });
}

export function scheduleIdleNotification(dailyCigarettes: number): Promise<IdleScheduleResult> {
  return enqueue(async () => {
    let permissionGranted = false;

    try {
      permissionGranted = await requestNotificationPermissions();
      if (!permissionGranted) {
        await cancelScheduled();
        return { scheduled: false, permissionGranted: false, error: null };
      }

      await configureAndroidChannel();
      await cancelScheduled();

      const schedule = computeIdleSchedule(Date.now(), dailyCigarettes);
      await Notifications.scheduleNotificationAsync({
        content: {
          title: IDLE_NOTIFICATION_TITLE,
          body: IDLE_NOTIFICATION_BODY,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: new Date(schedule.scheduledAtMs),
        },
      });

      return { scheduled: true, permissionGranted: true, error: null };
    } catch (caught) {
      try {
        await cancelScheduled();
      } catch {
        // A failed cleanup must not mask the original scheduling error.
      }
      return {
        scheduled: false,
        permissionGranted,
        error: toError(caught),
      };
    }
  });
}

export function cancelIdleNotification(): Promise<void> {
  return enqueue(async () => {
    await cancelScheduled();
  });
}

export function resetIdleNotificationFromProfile(): Promise<IdleScheduleResult> {
  const profile = getProfile();
  if (profile === null) {
    return Promise.resolve({ scheduled: false, permissionGranted: false, error: null });
  }
  return scheduleIdleNotification(profile.dailyCigarettes);
}
