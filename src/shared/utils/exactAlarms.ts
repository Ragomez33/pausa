import { Linking, Platform } from 'react-native';

/**
 * Android 12 (API 31) introduced the "Alarms & reminders" special access.
 * Without it `AlarmManager.canScheduleExactAlarms()` is false and
 * expo-notifications falls back to inexact alarms, which Android batches and
 * defers in Doze (all session prompts arriving together).
 *
 * expo-notifications 0.32 does not expose `canScheduleExactAlarmsAsync`, so the
 * app can only detect the OS version and guide the person to the system
 * settings. This helper centralizes that detection for testability.
 */
export const ANDROID_EXACT_ALARM_MIN_API = 31;

export function shouldGuideExactAlarmSetup(
  platform: string = Platform.OS,
  version: number | string = Platform.Version,
): boolean {
  if (platform !== 'android') {
    return false;
  }

  const apiLevel = typeof version === 'number' ? version : Number.parseInt(version, 10);
  return Number.isFinite(apiLevel) && apiLevel >= ANDROID_EXACT_ALARM_MIN_API;
}

export async function openSystemNotificationSettings(): Promise<boolean> {
  try {
    await Linking.openSettings();
    return true;
  } catch {
    return false;
  }
}
