import {
  ANDROID_EXACT_ALARM_MIN_API,
  shouldGuideExactAlarmSetup,
} from '../../utils/exactAlarms';

describe('shouldGuideExactAlarmSetup', () => {
  it('guides Android 12+ devices', () => {
    expect(shouldGuideExactAlarmSetup('android', ANDROID_EXACT_ALARM_MIN_API)).toBe(true);
    expect(shouldGuideExactAlarmSetup('android', 34)).toBe(true);
    expect(shouldGuideExactAlarmSetup('android', '33')).toBe(true);
  });

  it('does not guide older Android versions or other platforms', () => {
    expect(shouldGuideExactAlarmSetup('android', 30)).toBe(false);
    expect(shouldGuideExactAlarmSetup('ios', 17)).toBe(false);
    expect(shouldGuideExactAlarmSetup('web', 33)).toBe(false);
    expect(shouldGuideExactAlarmSetup('android', 'not-a-number')).toBe(false);
  });
});
