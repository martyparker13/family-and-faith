/**
 * Optional daily rhythm reminders via expo-notifications — three distinct
 * local notifications for morning, dinner, and bedtime. No push service involved.
 *
 * Android Expo Go (SDK 53+) removed remote push and evaluating
 * `expo-notifications` can throw at module load. That used to take down
 * `_layout.tsx` and expo-router ("missing default export"). Load the native
 * module lazily and no-op on Android Expo Go; keep real local reminders on
 * iOS Expo Go and all dev/production builds.
 *
 * Production/release must still initialize the handler, but never throw:
 * require + setNotificationHandler run on first use (not at import time) and
 * every native call is try/caught so a missing permission or module cannot
 * crash launch.
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

function installNotificationHandler(Notifications: NotificationsModule): void {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
  } catch {
    // setNotificationHandler must not throw during startup.
  }
}

function getNotifications(): NotificationsModule | null {
  if (isAndroidExpoGo()) {
    return null;
  }
  if (notificationsModule === undefined) {
    notificationsModule = loadNotificationsModule();
    if (notificationsModule) {
      installNotificationHandler(notificationsModule);
    }
  }
  return notificationsModule;
}

/**
 * Production / iOS Expo Go / dev clients: load the native module and install
 * the foreground handler. Safe to call more than once. No-ops on Android Expo
 * Go and when the module cannot load.
 */
export function initializeNotifications(): void {
  try {
    const Notifications = getNotifications();
    if (Notifications) installNotificationHandler(Notifications);
  } catch {
    // Import-time and first-paint must never throw.
  }
}

export type ReminderSlot = 'morning' | 'dinner' | 'bedtime';

function slotCopy(slot: ReminderSlot) {
  try {
    return {
      title: t(`notifications.${slot}.title`),
      body: t(`notifications.${slot}.body`),
      channel: `${slot}-reminder`,
      channelName: t(`notifications.${slot}.channelName`),
    };
  } catch {
    return {
      title: slot,
      body: slot,
      channel: `${slot}-reminder`,
      channelName: slot,
    };
  }
}

async function ensureAndroidChannels(Notifications: NotificationsModule): Promise<void> {
  if (Platform.OS !== 'android') return;

  try {
    await Notifications.setNotificationChannelAsync('daily-reminder', {
      name: t('notifications.dailyReminderChannel'),
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  } catch {
    // Channel creation is best-effort; permission prompt can still proceed.
  }

  for (const slot of ['morning', 'dinner', 'bedtime'] as ReminderSlot[]) {
    try {
      const { channel, channelName } = slotCopy(slot);
      await Notifications.setNotificationChannelAsync(channel, {
        name: channelName,
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    } catch {
      // Keep going so one channel failure cannot block reminders.
    }
  }
}

/** Asks for permission. Returns true when notifications are allowed. */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const Notifications = getNotifications();
    if (!Notifications) return false;

    await ensureAndroidChannels(Notifications);

    const existing = await Notifications.getPermissionsAsync();
    if (existing.granted) return true;
    const requested = await Notifications.requestPermissionsAsync();
    return requested.granted;
  } catch {
    return false;
  }
}

/** Schedule one repeating daily notification for a rhythm slot. */
export async function scheduleSlotReminder(
  slot: ReminderSlot,
  time: ReminderTime | null
): Promise<void> {
  try {
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
  } catch {
    // Permission, channel, or native-module failure must not crash the app.
  }
}

export interface RhythmReminders {
  morning: ReminderTime | null;
  dinner: ReminderTime | null;
  bedtime: ReminderTime | null;
}

/** Replaces all rhythm reminders with the given times (scoped per slot). */
export async function scheduleRhythmReminders(reminders: RhythmReminders): Promise<void> {
  try {
    await scheduleSlotReminder('morning', reminders.morning);
    await scheduleSlotReminder('dinner', reminders.dinner);
    await scheduleSlotReminder('bedtime', reminders.bedtime);
  } catch {
    // Individual slots already swallow errors; this is a final backstop.
  }
}

/**
 * Back-compat: single daily reminder with a stable identifier.
 * @deprecated Use scheduleRhythmReminders instead.
 */
export async function scheduleDailyReminder(time: ReminderTime | null): Promise<void> {
  try {
    const Notifications = getNotifications();
    if (!Notifications) return;

    await Notifications.cancelScheduledNotificationAsync(DAILY_REMINDER_ID).catch(() => {});
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
  } catch {
    // Same as scheduleSlotReminder — never throw to callers.
  }
}

/** Notification identifiers for testing. */
export function slotNotificationId(slot: ReminderSlot): string {
  return `rhythm-${slot}`;
}
