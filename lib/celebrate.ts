/**
 * Celebration logic for completing daily activities: haptic feedback plus a
 * message + confetti size for the moment ("all three done", streak
 * milestones). Pure decision logic lives here so the screens stay simple
 * and the milestone rules are testable.
 */
import * as Haptics from 'expo-haptics';

import { t } from '@/i18n/index';
import { allActivityDates, currentStreak } from '@/store/progress';

export interface Celebration {
  message: string | null;
  size: 'small' | 'big';
}

const STREAK_MILESTONES: Record<number, string> = {
  7: 'celebrations.streak7',
  30: 'celebrations.streak30',
  100: 'celebrations.streak100',
  365: 'celebrations.streak365',
};

interface ProgressSnapshot {
  completedDays: Record<number, string>;
  devotionalDays: Record<number, string>;
  prayerDays: Record<number, string>;
}

function milestoneMessage(streak: number): string | undefined {
  const key = STREAK_MILESTONES[streak];
  return key ? t(key) : undefined;
}

/**
 * Decides how to celebrate after an activity was just marked complete.
 * Call with the *post-toggle* store state.
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
  const message = milestoneMessage(streak);
  const milestoneAlreadyCelebrated = celebratedMilestonesToday[streak] === todayISO;

  if (message && !milestoneAlreadyCelebrated) {
    return { message, size: 'big' };
  }
  if (allThreeDone) {
    return { message: t('celebrations.allThreeDone'), size: 'big' };
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
  const expected = milestoneMessage(streak);
  if (expected === celebration.message) return streak;
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
