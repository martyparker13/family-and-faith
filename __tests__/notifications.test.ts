import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import {
  DAILY_REMINDER_ID,
  initializeNotifications,
  isAndroidExpoGo,
  requestNotificationPermission,
  scheduleDailyReminder,
  scheduleRhythmReminders,
  slotNotificationId,
} from '@/lib/notifications';

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn().mockResolvedValue(undefined),
  scheduleNotificationAsync: jest.fn().mockResolvedValue(undefined),
  AndroidImportance: { DEFAULT: 3 },
  SchedulableTriggerInputTypes: { DAILY: 'daily' },
}));

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { appOwnership: 'standalone' },
}));

const originalOS = Platform.OS;

function setPlatformOS(os: typeof Platform.OS) {
  Object.defineProperty(Platform, 'OS', { configurable: true, value: os });
}

function setAppOwnership(ownership: string | null) {
  (Constants as { appOwnership: string | null }).appOwnership = ownership;
}

afterEach(() => {
  setPlatformOS(originalOS);
  setAppOwnership('standalone');
  jest.clearAllMocks();
});

describe('slot notifications', () => {
  it('uses stable identifiers per slot', () => {
    expect(slotNotificationId('morning')).toBe('rhythm-morning');
    expect(slotNotificationId('dinner')).toBe('rhythm-dinner');
    expect(slotNotificationId('bedtime')).toBe('rhythm-bedtime');
  });
});

describe('production notification init', () => {
  it('installs the foreground handler on an Android production build', () => {
    setPlatformOS('android');
    setAppOwnership('standalone');
    expect(() => initializeNotifications()).not.toThrow();
    expect(Notifications.setNotificationHandler).toHaveBeenCalled();
  });

  it('still schedules local reminders after init', async () => {
    setPlatformOS('android');
    setAppOwnership('standalone');
    initializeNotifications();
    await scheduleDailyReminder({ hour: 8, minute: 0 });
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalled();
  });

  it('returns false when permission APIs throw', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockRejectedValue(new Error('native'));
    await expect(requestNotificationPermission()).resolves.toBe(false);
  });
});

describe('isAndroidExpoGo', () => {
  it('is true only for Android Expo Go', () => {
    setPlatformOS('android');
    setAppOwnership('expo');
    expect(isAndroidExpoGo()).toBe(true);
  });

  it('is false on iOS Expo Go', () => {
    setPlatformOS('ios');
    setAppOwnership('expo');
    expect(isAndroidExpoGo()).toBe(false);
  });

  it('is false on an Android development or production build', () => {
    setPlatformOS('android');
    setAppOwnership('standalone');
    expect(isAndroidExpoGo()).toBe(false);
  });
});

describe('requestNotificationPermission', () => {
  beforeEach(() => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ granted: false });
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ granted: true });
  });

  it('returns true when already granted', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ granted: true });
    await expect(requestNotificationPermission()).resolves.toBe(true);
    expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
  });

  it('requests permission when not yet granted', async () => {
    await expect(requestNotificationPermission()).resolves.toBe(true);
    expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
  });

  it('creates Android notification channel', async () => {
    setPlatformOS('android');
    await requestNotificationPermission();
    expect(Notifications.setNotificationChannelAsync).toHaveBeenCalledWith(
      'daily-reminder',
      expect.objectContaining({ name: 'Daily reminder' })
    );
  });

  it('no-ops on Android Expo Go without calling native APIs', async () => {
    setPlatformOS('android');
    setAppOwnership('expo');
    await expect(requestNotificationPermission()).resolves.toBe(false);
    expect(Notifications.setNotificationChannelAsync).not.toHaveBeenCalled();
    expect(Notifications.getPermissionsAsync).not.toHaveBeenCalled();
    expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
  });
});

describe('scheduleDailyReminder', () => {
  it('cancels only the daily reminder identifier when turning off', async () => {
    await scheduleDailyReminder(null);
    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith(DAILY_REMINDER_ID);
    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('schedules with stable identifier and daily trigger', async () => {
    await scheduleDailyReminder({ hour: 19, minute: 30 });
    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith(DAILY_REMINDER_ID);
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        identifier: DAILY_REMINDER_ID,
        trigger: expect.objectContaining({ hour: 19, minute: 30 }),
      })
    );
  });

  it('does not cancel all scheduled notifications', async () => {
    await scheduleDailyReminder({ hour: 8, minute: 0 });
    expect(
      (Notifications as unknown as { cancelAllScheduledNotificationsAsync?: jest.Mock })
        .cancelAllScheduledNotificationsAsync
    ).toBeUndefined();
  });

  it('still schedules on iOS Expo Go', async () => {
    setPlatformOS('ios');
    setAppOwnership('expo');
    await scheduleDailyReminder({ hour: 8, minute: 0 });
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalled();
  });

  it('no-ops schedule and cancel on Android Expo Go', async () => {
    setPlatformOS('android');
    setAppOwnership('expo');
    await expect(scheduleDailyReminder({ hour: 8, minute: 0 })).resolves.toBeUndefined();
    expect(Notifications.cancelScheduledNotificationAsync).not.toHaveBeenCalled();
    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });
});

describe('scheduleRhythmReminders', () => {
  it('schedules each configured slot', async () => {
    await scheduleRhythmReminders({
      morning: { hour: 7, minute: 0 },
      dinner: null,
      bedtime: { hour: 20, minute: 30 },
    });
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(2);
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({ identifier: slotNotificationId('morning') })
    );
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({ identifier: slotNotificationId('bedtime') })
    );
  });

  it('no-ops on Android Expo Go so hydrate can still call it', async () => {
    setPlatformOS('android');
    setAppOwnership('expo');
    await expect(
      scheduleRhythmReminders({
        morning: { hour: 7, minute: 0 },
        dinner: { hour: 18, minute: 0 },
        bedtime: { hour: 20, minute: 30 },
      })
    ).resolves.toBeUndefined();
    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    expect(Notifications.cancelScheduledNotificationAsync).not.toHaveBeenCalled();
  });
});
