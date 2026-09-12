/**
 * Celebration logic for completing daily activities: haptic feedback plus a
 * message + confetti size for the moment ("all three done", streak
 * milestones). Pure decision logic lives here so the screens stay simple
 * and the milestone rules are testable.
 */
import * as Haptics from 'expo-haptics';

import { allActivityDates, currentStreak } from '@/store/progress';

export interface Celebration {
  message: string | null;
  size: 'small' | 'big';
}

const STREAK_MILESTONES: Record<number, string> = {
  7: '🔥 One whole week together!',
  30: '🔥 30 days — a family habit!',
  100: '🔥 100 days! Amazing faithfulness!',
  365: '🏆 A FULL YEAR — you did it!',
};

interface ProgressSnapshot {
  completedDays: Record<number, string>;
  devotionalDays: Record<number, string>;
  prayerDays: Record<number, string>;
}

/**
 * Decides how to celebrate after an activity was just marked complete.
 * Call with the *post-toggle* store state.
 *
 * `celebratedMilestonesToday` maps streak milestone values (7, 30, …) to
 * the calendar date they were last celebrated — prevents firing the same
 * milestone up to three times when finishing reading, devotional, and prayer.
 */
export function celebrationFor(
  state: ProgressSnapshot,
  day: number,
  todayISO: string,
  celebratedMilestonesToday: Record<number, string> = {}
): Celebration {
  const allThreeDone = Boolean(
    state.completedDays[day] && state.devotionalDays[day] && state.prayerDays[day]
  );
  const streak = currentStreak(allActivityDates(state), todayISO);
  const milestoneMessage = STREAK_MILESTONES[streak];
  const milestoneAlreadyCelebrated = celebratedMilestonesToday[streak] === todayISO;

  if (milestoneMessage && !milestoneAlreadyCelebrated) {
    return { message: milestoneMessage, size: 'big' };
  }
  if (allThreeDone) {
    return { message: '🎉 Reading, devotional & prayer — all done today!', size: 'big' };
  }
  return { message: null, size: 'small' };
}

/** Returns true when the celebration is a streak milestone worth recording. */
export function isStreakMilestoneCelebration(
  state: ProgressSnapshot,
  todayISO: string,
  celebration: Celebration
): number | null {
  if (celebration.size !== 'big' || !celebration.message) return null;
  const streak = currentStreak(allActivityDates(state), todayISO);
  if (STREAK_MILESTONES[streak] === celebration.message) return streak;
  return null;
}

/** Haptic feedback matched to the celebration size (no-op on web). */
export async function celebrationHaptics(size: 'small' | 'big'): Promise<void> {
  try {
    if (size === 'big') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  } catch {
    // Haptics are best-effort (unsupported on some devices/web).
  }
}

/** Light tick for un-completing — feedback without fanfare. */
export async function undoHaptics(): Promise<void> {
  try {
    await Haptics.selectionAsync();
  } catch {
    // best-effort
  }
}
