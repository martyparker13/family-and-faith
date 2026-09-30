/**
 * Optional daily rhythm reminders via expo-notifications — three distinct
 * local notifications for morning, dinner, and bedtime. No push service involved.
 *
 * Android Expo Go (SDK 53+) removed remote push and evaluating
 * `expo-notifications` can throw at module load. That used to take down
 * `_layout.tsx` and expo-router ("missing default export"). Load the native
 * module lazily and no-op on Android Expo Go; keep real local reminders on
 * iOS Expo Go and all dev/production builds.
 */
import Constants from 'expo-constants';
import type * as NotificationsNS from 'expo-notifications';
import { Platform } from 'react-native';

import { t } from '@/i18n/index';
import type { ReminderTime } from '@/store/settings';

/** Stable identifier for the legacy single daily reminder API. */
export const DAILY_REMINDER_ID = 'ff-daily-reminder';

type NotificationsModule = typeof NotificationsNS;

let notificationsModule: NotificationsModule | null | undefined;

/** Android Expo Go cannot load expo-notifications (SDK 53+). */
export function isAndroidExpoGo(): boolean {
  return Platform.OS === 'android' && Constants.appOwnership === 'expo';
}

function loadNotificationsModule(): NotificationsModule | null {
  if (isAndroidExpoGo()) {
    return null;
  }
  try {
    // Lazy require so a static import cannot crash the root layout.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-notifications') as NotificationsModule;
  } catch {
    return null;
  }
}

function getNotifications(): NotificationsModule | null {
  if (isAndroidExpoGo()) {
    return null;
  }
  if (notificationsModule === undefined) {
    notificationsModule = loadNotificationsModule();
  }
  return notificationsModule;
}

try {
  const Notifications = getNotifications();
  Notifications?.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
} catch {
  // setNotificationHandler must not throw during import.
}

export type ReminderSlot = 'morning' | 'dinner' | 'bedtime';

function slotCopy(slot: ReminderSlot) {
  return {
    title: t(`notifications.${slot}.title`),
    body: t(`notifications.${slot}.body`),
    channel: `${slot}-reminder`,
    channelName: t(`notifications.${slot}.channelName`),
  };
}

/** Asks for permission. Returns true when notifications are allowed. */
export async function requestNotificationPermission(): Promise<boolean> {
  const Notifications = getNotifications();
  if (!Notifications) return false;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('daily-reminder', {
      name: t('notifications.dailyReminderChannel'),
      importance: Notifications.AndroidImportance.DEFAULT,
    });
    for (const slot of ['morning', 'dinner', 'bedtime'] as ReminderSlot[]) {
      const { channel, channelName } = slotCopy(slot);
      await Notifications.setNotificationChannelAsync(channel, {
        name: channelName,
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }
  }
  const existing = await Notifications.getPermissionsAsync();
  if (existing.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

/** Schedule one repeating daily notification for a rhythm slot. */
export async function scheduleSlotReminder(
  slot: ReminderSlot,
  time: ReminderTime | null
): Promise<void> {
  const Notifications = getNotifications();
  if (!Notifications) return;

  const identifier = slotNotificationId(slot);
  await Notifications.cancelScheduledNotificationAsync(identifier).catch(() => {});

  if (!time) return;

  const copy = slotCopy(slot);
  await Notifications.scheduleNotificationAsync({
    identifier,
    content: {
      title: copy.title,
      body: copy.body,
      data: { slot },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: time.hour,
      minute: time.minute,
      channelId: Platform.OS === 'android' ? copy.channel : undefined,
    },
  });
}

export interface RhythmReminders {
  morning: ReminderTime | null;
  dinner: ReminderTime | null;
  bedtime: ReminderTime | null;
}

/** Replaces all rhythm reminders with the given times (scoped per slot). */
export async function scheduleRhythmReminders(reminders: RhythmReminders): Promise<void> {
  await scheduleSlotReminder('morning', reminders.morning);
  await scheduleSlotReminder('dinner', reminders.dinner);
  await scheduleSlotReminder('bedtime', reminders.bedtime);
}

/**
 * Back-compat: single daily reminder with a stable identifier.
 * @deprecated Use scheduleRhythmReminders instead.
 */
export async function scheduleDailyReminder(time: ReminderTime | null): Promise<void> {
  const Notifications = getNotifications();
  if (!Notifications) return;

  await Notifications.cancelScheduledNotificationAsync(DAILY_REMINDER_ID);
  if (!time) return;

  await Notifications.scheduleNotificationAsync({
    identifier: DAILY_REMINDER_ID,
    content: {
      title: t('notifications.legacy.title'),
      body: t('notifications.legacy.body'),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: time.hour,
      minute: time.minute,
      channelId: Platform.OS === 'android' ? 'daily-reminder' : undefined,
    },
  });
}

/** Notification identifiers for testing. */
export function slotNotificationId(slot: ReminderSlot): string {
  return `rhythm-${slot}`;
}
