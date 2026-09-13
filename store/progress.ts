import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/**
 * Tracks the family's progress through the three daily activities.
 *
 * `completedDays` maps plan day (1–365) → the local "YYYY-MM-DD" date it was
 * completed. Storing the completion date lets us compute the streak of
 * consecutive *calendar days* the family showed up.
 *
 * Devotional and prayer completion are managed by `store/daily-content.ts`
 * (they cycle independently of the reading plan).
 */
export type Activity = 'reading';

interface ProgressState {
  /** Reading completions (drives "% of Bible completed" and streak). */
  completedDays: Record<number, string>;
  /** Weeks (0-based index) whose memory verse the family practiced. */
  practicedWeeks: Record<number, string>;

  toggleDay: (day: number, todayISO: string) => void;
  togglePracticedWeek: (week: number, todayISO: string) => void;
  resetProgress: () => void;
}

export const useProgress = create<ProgressState>()(
  persist(
    (set) => ({
      completedDays: {},
      practicedWeeks: {},

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

      resetProgress: () => set({ completedDays: {}, practicedWeeks: {} }),
    }),
    {
      name: 'ff-progress',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

/**
 * All completion-date values for streak calculation.
 * Pass `extraDates` to include devotional/prayer dates from `useDailyContent`.
 */
export function allActivityDates(
  completedDays: Record<number, string>,
  extraDates: (string | null)[] = []
): string[] {
  const dates = Object.values(completedDays);
  for (const d of extraDates) if (d) dates.push(d);
  return dates;
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
