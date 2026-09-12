import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import {
  DAILY_REMINDER_ID,
  requestNotificationPermission,
  scheduleDailyReminder,
} from '@/lib/notifications';

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  AndroidImportance: { DEFAULT: 3 },
  SchedulableTriggerInputTypes: { DAILY: 'daily' },
}));

describe('requestNotificationPermission', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
    const originalOS = Platform.OS;
    Object.defineProperty(Platform, 'OS', { value: 'android' });
    await requestNotificationPermission();
    expect(Notifications.setNotificationChannelAsync).toHaveBeenCalledWith(
      'daily-reminder',
      expect.objectContaining({ name: 'Daily reminder' })
    );
    Object.defineProperty(Platform, 'OS', { value: originalOS });
  });
});

describe('scheduleDailyReminder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

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
});
