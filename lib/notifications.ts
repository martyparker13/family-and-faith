/**
 * Optional daily reminder via expo-notifications. The reminder is a single
 * repeating local notification — no push service or backend involved.
 */
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/** Asks for permission. Returns true when notifications are allowed. */
export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('daily-reminder', {
      name: 'Daily reminder',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  const existing = await Notifications.getPermissionsAsync();
  if (existing.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

/**
 * Replaces any existing daily reminder with one at the given local time.
 * Pass null to cancel the reminder entirely.
 */
export async function scheduleDailyReminder(
  time: { hour: number; minute: number } | null
): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!time) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Family time with God 🌿',
      body: "Today's reading, devotional, and prayer are ready for your family.",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: time.hour,
      minute: time.minute,
      channelId: Platform.OS === 'android' ? 'daily-reminder' : undefined,
    },
  });
}
