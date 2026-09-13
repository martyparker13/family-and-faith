/**
 * Optional daily rhythm reminders via expo-notifications — three distinct
 * local notifications for morning, dinner, and bedtime. No push service involved.
 */
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { t } from '@/i18n/index';
import type { ReminderTime } from '@/store/settings';

/** Stable identifier for the legacy single daily reminder API. */
export const DAILY_REMINDER_ID = 'ff-daily-reminder';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

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
