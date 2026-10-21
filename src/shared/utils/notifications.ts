import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import { getLatestHabitInteractionAtMs, getProfile } from '@/db/queries';
import type { SmokingTrigger } from '@/shared/constants/smoking';
import {
  IDLE_NOTIFICATION_BODY,
  IDLE_NOTIFICATION_CHANNEL_ID,
  IDLE_NOTIFICATION_DATA_TYPE,
  IDLE_NOTIFICATION_ID,
  IDLE_NOTIFICATION_TITLE,
  SESSION_NOTIFICATION_CHANNEL_ID,
  SESSION_NOTIFICATION_TITLE,
} from '@/shared/constants/notifications';

import { computeIdleScheduleFromAnchor } from './reminderSchedule';
import {
  SESSION_NOTIFICATION_ID_PREFIX,
  buildSessionPromptBody,
  buildSmokingSessionNotificationData,
  computeSessionPrompts,
} from './sessionPromptSchedule';

export interface IdleScheduleResult {
  scheduled: boolean;
  permissionGranted: boolean;
  error: Error | null;
}

export interface IdleScheduleInput {
  dailyCigarettes: number;
  lastInteractionAtMs: number;
  nowMs?: number;
}

export interface SessionPromptScheduleResult {
  scheduled: boolean;
  permissionGranted: boolean;
  scheduledCount: number;
  error: Error | null;
}

export interface SessionPromptScheduleInput {
  sessionId: string;
  startedAtMs: number;
  triggerEmotion: SmokingTrigger;
  nowMs?: number;
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

async function cancelNotificationsByPrefix(prefix: string): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const matching = scheduled.filter((request) =>
    request.identifier.startsWith(prefix),
  );

  await Promise.all(
    matching.map((request) =>
      Notifications.cancelScheduledNotificationAsync(request.identifier),
    ),
  );
}

async function cancelIdleNotificationInternal(): Promise<void> {
  await cancelNotificationsByPrefix(`${IDLE_NOTIFICATION_ID}`);
}

async function cancelSessionNotificationsInternal(): Promise<void> {
  await cancelNotificationsByPrefix(SESSION_NOTIFICATION_ID_PREFIX);
}

async function hasPendingIdleNotificationInternal(): Promise<boolean> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return scheduled.some((request) => request.identifier === IDLE_NOTIFICATION_ID);
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

async function hasNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  return current.granted;
}

async function configureAndroidChannels(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  await Notifications.setNotificationChannelAsync(IDLE_NOTIFICATION_CHANNEL_ID, {
    name: 'Recordatorios de inactividad',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    sound: 'default',
  });

  await Notifications.setNotificationChannelAsync(SESSION_NOTIFICATION_CHANNEL_ID, {
    name: 'Sesiones de fumado',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    sound: 'default',
  });
}

export function scheduleIdleNotification(
  input: IdleScheduleInput,
): Promise<IdleScheduleResult> {
  return enqueue(() => scheduleIdleNotificationTask(input));
}

async function scheduleIdleNotificationTask(
  input: IdleScheduleInput,
): Promise<IdleScheduleResult> {
  let permissionGranted = false;

  try {
    await configureAndroidChannels();
    permissionGranted = await requestNotificationPermissions();
    if (!permissionGranted) {
      await cancelIdleNotificationInternal();
      return { scheduled: false, permissionGranted: false, error: null };
    }

    await cancelIdleNotificationInternal();

    const nowMs = input.nowMs ?? Date.now();
    const schedule = computeIdleScheduleFromAnchor(
      input.lastInteractionAtMs,
      nowMs,
      input.dailyCigarettes,
    );

    await Notifications.scheduleNotificationAsync({
      identifier: IDLE_NOTIFICATION_ID,
      content: {
        title: IDLE_NOTIFICATION_TITLE,
        body: IDLE_NOTIFICATION_BODY,
        data: { type: IDLE_NOTIFICATION_DATA_TYPE },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(schedule.scheduledAtMs),
        channelId: IDLE_NOTIFICATION_CHANNEL_ID,
      },
    });

    return { scheduled: true, permissionGranted: true, error: null };
  } catch (caught) {
    try {
      await cancelIdleNotificationInternal();
    } catch {
      // A failed cleanup must not mask the original scheduling error.
    }
    return {
      scheduled: false,
      permissionGranted,
      error: toError(caught),
    };
  }
}

export function cancelIdleNotification(): Promise<void> {
  return enqueue(async () => {
    await cancelIdleNotificationInternal();
  });
}

/**
 * Re-arms the idle reminder only when none is pending. This is used on
 * foreground transitions: it never cancels or restarts an existing reminder,
 * so frequently opening the app no longer prevents it from being delivered.
 */
export function ensureIdleNotificationFromProfile(
  nowMs?: number,
): Promise<IdleScheduleResult> {
  return enqueue(async () => {
    if (await hasPendingIdleNotificationInternal()) {
      if (await hasNotificationPermission()) {
        return { scheduled: false, permissionGranted: true, error: null };
      }
      await cancelIdleNotificationInternal();
      return { scheduled: false, permissionGranted: false, error: null };
    }

    const profile = getProfile();
    if (profile === null) {
      return { scheduled: false, permissionGranted: false, error: null };
    }

    const safeNow = nowMs ?? Date.now();
    return scheduleIdleNotificationTask({
      dailyCigarettes: profile.dailyCigarettes,
      lastInteractionAtMs: getLatestHabitInteractionAtMs() ?? safeNow,
      nowMs: safeNow,
    });
  });
}

/**
 * Cancels and re-schedules the reminder anchored to the latest real habit
 * interaction. Opening the app alone does not call this.
 */
export function resetIdleNotificationFromProfile(): Promise<IdleScheduleResult> {
  return enqueue(async () => {
    const profile = getProfile();
    if (profile === null) {
      return { scheduled: false, permissionGranted: false, error: null };
    }

    const nowMs = Date.now();
    return scheduleIdleNotificationTask({
      dailyCigarettes: profile.dailyCigarettes,
      lastInteractionAtMs: getLatestHabitInteractionAtMs() ?? nowMs,
      nowMs,
    });
  });
}

export function scheduleSessionPrompts(
  input: SessionPromptScheduleInput,
): Promise<SessionPromptScheduleResult> {
  return enqueue(async () => {
    let permissionGranted = false;

    try {
      await configureAndroidChannels();
      permissionGranted = await requestNotificationPermissions();
      if (!permissionGranted) {
        await cancelSessionNotificationsInternal();
        return {
          scheduled: false,
          permissionGranted: false,
          scheduledCount: 0,
          error: null,
        };
      }

      await cancelSessionNotificationsInternal();

      const nowMs = input.nowMs ?? Date.now();
      const prompts = computeSessionPrompts(input.sessionId, input.startedAtMs, nowMs);
      const data = buildSmokingSessionNotificationData({
        sessionId: input.sessionId,
        startedAtMs: input.startedAtMs,
        triggerEmotion: input.triggerEmotion,
      });

      for (const prompt of prompts) {
        const seconds = Math.max(
          1,
          Math.round((prompt.scheduledAtMs - nowMs) / 1_000),
        );
        await Notifications.scheduleNotificationAsync({
          identifier: prompt.identifier,
          content: {
            title: SESSION_NOTIFICATION_TITLE,
            body: buildSessionPromptBody(prompt.minutes),
            data,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds,
            repeats: false,
            channelId: SESSION_NOTIFICATION_CHANNEL_ID,
          },
        });
      }

      return {
        scheduled: prompts.length > 0,
        permissionGranted: true,
        scheduledCount: prompts.length,
        error: null,
      };
    } catch (caught) {
      try {
        await cancelSessionNotificationsInternal();
      } catch {
        // A failed cleanup must not mask the original scheduling error.
      }
      return {
        scheduled: false,
        permissionGranted,
        scheduledCount: 0,
        error: toError(caught),
      };
    }
  });
}

export function cancelSessionPrompts(): Promise<void> {
  return enqueue(async () => {
    await cancelSessionNotificationsInternal();
  });
}
