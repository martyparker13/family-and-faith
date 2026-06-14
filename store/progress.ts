import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/**
 * Tracks the family's progress through the three daily activities.
 *
 * Each record maps plan day (1–365) → the local "YYYY-MM-DD" date it was
 * completed. Storing the completion date lets us compute the streak of
 * consecutive *calendar days* the family showed up (catching up on old
 * readings still counts as showing up today).
 *
 * `completedDays` keeps its original name (it predates the other two) and
 * tracks the Bible reading — the % of the Bible completed comes from it.
 */
export type Activity = 'reading' | 'devotional' | 'prayer';

interface ProgressState {
  /** Reading completions (drives "% of Bible completed"). */
  completedDays: Record<number, string>;
  devotionalDays: Record<number, string>;
  prayerDays: Record<number, string>;
  /** Weeks (0-based index) whose memory verse the family practiced. */
  practicedWeeks: Record<number, string>;

  toggleActivity: (activity: Activity, day: number, todayISO: string) => void;
  /** Back-compat alias for toggling the reading. */
  toggleDay: (day: number, todayISO: string) => void;
  togglePracticedWeek: (week: number, todayISO: string) => void;
  resetProgress: () => void;
}

const ACTIVITY_KEY: Record<Activity, 'completedDays' | 'devotionalDays' | 'prayerDays'> = {
  reading: 'completedDays',
  devotional: 'devotionalDays',
  prayer: 'prayerDays',
};

export const useProgress = create<ProgressState>()(
  persist(
    (set) => ({
      completedDays: {},
      devotionalDays: {},
      prayerDays: {},
      practicedWeeks: {},

      toggleActivity: (activity, day, todayISO) =>
        set((state) => {
          const key = ACTIVITY_KEY[activity];
          const next = { ...state[key] };
          if (next[day]) {
            delete next[day];
          } else {
            next[day] = todayISO;
          }
          return { [key]: next };
        }),
      toggleDay: (day, todayISO) =>
        set((state) => {
          const next = { ...state.completedDays };
          if (next[day]) {
            delete next[day];
          } else {
            next[day] = todayISO;
          }
          return { completedDays: next };
        }),
      togglePracticedWeek: (week, todayISO) =>
        set((state) => {
          const next = { ...state.practicedWeeks };
          if (next[week]) {
            delete next[week];
          } else {
            next[week] = todayISO;
          }
          return { practicedWeeks: next };
        }),
      resetProgress: () =>
        set({ completedDays: {}, devotionalDays: {}, prayerDays: {}, practicedWeeks: {} }),
    }),
    {
      name: 'ff-progress',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

/** All completion-date values across the three activities. */
export function allActivityDates(state: {
  completedDays: Record<number, string>;
  devotionalDays: Record<number, string>;
  prayerDays: Record<number, string>;
}): string[] {
  return [
    ...Object.values(state.completedDays),
    ...Object.values(state.devotionalDays),
    ...Object.values(state.prayerDays),
  ];
}

/** Percentage (0–100) of the 365-day reading plan completed. */
export function percentComplete(completedDays: Record<number, string>): number {
  return Math.round((Object.keys(completedDays).length / 365) * 100);
}

/**
 * Current streak: consecutive calendar days (ending today or yesterday) on
 * which the family completed at least one activity. A streak ending
 * yesterday is preserved so the flame doesn't reset before tonight's
 * family time.
 */
export function currentStreak(dates: Iterable<string>, todayISO: string): number {
  const activeDates = new Set(dates);
  if (activeDates.size === 0) return 0;

  const cursor = new Date(`${todayISO}T12:00:00`);
  // Allow the streak to start counting from yesterday if today isn't done yet.
  if (!activeDates.has(toISO(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!activeDates.has(toISO(cursor))) return 0;
  }

  let streak = 0;
  while (activeDates.has(toISO(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
