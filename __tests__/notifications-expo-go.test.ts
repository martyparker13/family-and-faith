/**
 * Isolated load of lib/notifications when expo-notifications throws at
 * require-time — the Android Expo Go failure mode after SDK 53.
 */
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const loadError = new Error(
  'expo-notifications: Android Push notifications (remote notifications) functionality provided by expo-notifications was removed from Expo Go with the release of SDK 53.'
);

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { appOwnership: 'expo' },
}));

jest.mock('expo-notifications', () => {
  throw new Error(
    'expo-notifications: Android Push notifications (remote notifications) functionality provided by expo-notifications was removed from Expo Go with the release of SDK 53.'
  );
});

const originalOS = Platform.OS;

function loadNotifications() {
  return require('@/lib/notifications') as typeof import('@/lib/notifications');
}

afterEach(() => {
  Object.defineProperty(Platform, 'OS', { configurable: true, value: originalOS });
  (Constants as { appOwnership: string | null }).appOwnership = 'expo';
});

describe('Android Expo Go import safety', () => {
  it('imports without throwing when expo-notifications cannot load', () => {
    jest.resetModules();
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'android' });
    (Constants as { appOwnership: string | null }).appOwnership = 'expo';

    expect(() => loadNotifications()).not.toThrow();
  });

  it('hydrates schedule/permission as no-ops', async () => {
    jest.resetModules();
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'android' });
    (Constants as { appOwnership: string | null }).appOwnership = 'expo';

    const {
      requestNotificationPermission,
      scheduleRhythmReminders,
      scheduleDailyReminder,
    } = loadNotifications();

    await expect(requestNotificationPermission()).resolves.toBe(false);
    await expect(
      scheduleRhythmReminders({
        morning: { hour: 7, minute: 0 },
        dinner: { hour: 18, minute: 0 },
        bedtime: { hour: 20, minute: 30 },
      })
    ).resolves.toBeUndefined();
    await expect(scheduleDailyReminder({ hour: 8, minute: 0 })).resolves.toBeUndefined();
  });

  it('falls back to stubs if require throws outside Expo Go detection', async () => {
    jest.resetModules();
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
    (Constants as { appOwnership: string | null }).appOwnership = 'standalone';

    const { requestNotificationPermission, scheduleDailyReminder } = loadNotifications();

    await expect(requestNotificationPermission()).resolves.toBe(false);
    await expect(scheduleDailyReminder({ hour: 8, minute: 0 })).resolves.toBeUndefined();
    expect(loadError.message).toContain('removed from Expo Go');
  });
});
