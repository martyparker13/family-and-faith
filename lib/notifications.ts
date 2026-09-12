/**
 * Optional daily rhythm reminders via expo-notifications — three distinct
 * local notifications for morning, dinner, and bedtime. No push service involved.
 */
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { ReminderTime } from '@/store/settings';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const SLOT_COPY = {
  morning: {
    title: 'Good morning ☀️',
    body: 'Start the day with today’s Bible reading and memory verse.',
    channel: 'morning-reminder',
    channelName: 'Morning reminder',
  },
  dinner: {
    title: 'Dinner talk 🍽️',
    body: 'Tonight’s devotional is ready — one question at a time.',
    channel: 'dinner-reminder',
    channelName: 'Dinner reminder',
  },
  bedtime: {
    title: 'Bedtime prayer 🌙',
    body: 'Wind down together with tonight’s family prayer.',
    channel: 'bedtime-reminder',
    channelName: 'Bedtime reminder',
  },
} as const;

export type ReminderSlot = keyof typeof SLOT_COPY;

/** Asks for permission. Returns true when notifications are allowed. */
export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    for (const slot of Object.keys(SLOT_COPY) as ReminderSlot[]) {
      const { channel, channelName } = SLOT_COPY[slot];
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
  const identifier = `rhythm-${slot}`;
  await Notifications.cancelScheduledNotificationAsync(identifier).catch(() => {});

  if (!time) return;

  const copy = SLOT_COPY[slot];
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

/** Replaces all rhythm reminders with the given times. */
export async function scheduleRhythmReminders(reminders: RhythmReminders): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await scheduleSlotReminder('morning', reminders.morning);
  await scheduleSlotReminder('dinner', reminders.dinner);
  await scheduleSlotReminder('bedtime', reminders.bedtime);
}

/**
 * Back-compat: single daily reminder mapped to morning slot.
 * @deprecated Use scheduleRhythmReminders instead.
 */
export async function scheduleDailyReminder(time: ReminderTime | null): Promise<void> {
  await scheduleRhythmReminders({
    morning: time,
    dinner: null,
    bedtime: null,
  });
}

/** Notification identifiers for testing. */
export function slotNotificationId(slot: ReminderSlot): string {
  return `rhythm-${slot}`;
}
