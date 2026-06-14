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
 */
export function celebrationFor(
  state: ProgressSnapshot,
  day: number,
  todayISO: string
): Celebration {
  const allThreeDone = Boolean(
    state.completedDays[day] && state.devotionalDays[day] && state.prayerDays[day]
  );
  const streak = currentStreak(allActivityDates(state), todayISO);
  const milestone = STREAK_MILESTONES[streak];

  if (milestone) {
    return { message: milestone, size: 'big' };
  }
  if (allThreeDone) {
    return { message: '🎉 Reading, devotional & prayer — all done today!', size: 'big' };
  }
  return { message: null, size: 'small' };
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
