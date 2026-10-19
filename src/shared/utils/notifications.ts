import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import {
  DEFAULT_WAKING_HOURS,
  buildReminderDates,
  calculateReminderIntervalMinutes,
} from './reminderSchedule';

export const INACTIVITY_MESSAGE =
  'Tienes ganas de fumar? Abre la app antes de encenderlo.';

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

export async function scheduleLocalNotification(
  title: string,
  body: string,
  seconds: number,
): Promise<string> {
  return Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds },
  });
}

export interface ScheduleRemindersResult {
  scheduled: number;
  permissionGranted: boolean;
}

export async function scheduleInactivityReminders(
  dailyCigarettes: number,
  wakingHours = DEFAULT_WAKING_HOURS,
): Promise<ScheduleRemindersResult> {
  let permissionGranted = false;

  try {
    permissionGranted = await requestNotificationPermissions();
    if (!permissionGranted) {
      return { scheduled: 0, permissionGranted: false };
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('inactivity', {
        name: 'Recordatorios de pausa',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    await Notifications.cancelAllScheduledNotificationsAsync();

    const interval = calculateReminderIntervalMinutes(dailyCigarettes, wakingHours);
    const dates = buildReminderDates(Date.now(), interval);

    for (const date of dates) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Pausa',
          body: INACTIVITY_MESSAGE,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: new Date(date),
        },
      });
    }

    return { scheduled: dates.length, permissionGranted: true };
  } catch {
    return { scheduled: 0, permissionGranted };
  }
}

export async function cancelInactivityReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
