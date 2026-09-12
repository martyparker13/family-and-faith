import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { slotActivity, type RhythmSlot } from '@/lib/rhythm';

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
  /** Per-rhythm-slot completions for slot streaks. */
  slotCompletions: Record<RhythmSlot, Record<number, string>>;
  /** Family challenges marked done per plan day. */
  familyChallengesDone: Record<number, boolean>;

  toggleActivity: (activity: Activity, day: number, todayISO: string) => void;
  /** Back-compat alias for toggling the reading. */
  toggleDay: (day: number, todayISO: string) => void;
  togglePracticedWeek: (week: number, todayISO: string) => void;
  markSlotComplete: (slot: RhythmSlot, day: number, todayISO: string) => void;
  toggleFamilyChallenge: (day: number) => void;
  resetProgress: () => void;
  applyImportedProgress: (partial: {
    completedDays?: Record<number, string>;
    devotionalDays?: Record<number, string>;
    prayerDays?: Record<number, string>;
    practicedWeeks?: Record<number, string>;
    slotCompletions?: Record<RhythmSlot, Record<number, string>>;
    familyChallengesDone?: Record<number, boolean>;
  }) => void;
}

const ACTIVITY_KEY: Record<Activity, 'completedDays' | 'devotionalDays' | 'prayerDays'> = {
  reading: 'completedDays',
  devotional: 'devotionalDays',
  prayer: 'prayerDays',
};

const EMPTY_SLOTS: Record<RhythmSlot, Record<number, string>> = {
  morning: {},
  dinner: {},
  bedtime: {},
};

function syncSlotFromActivity(
  activity: Activity,
  day: number,
  todayISO: string,
  slotCompletions: Record<RhythmSlot, Record<number, string>>
): Record<RhythmSlot, Record<number, string>> {
  const slotMap: Partial<Record<Activity, RhythmSlot>> = {
    reading: 'morning',
    devotional: 'dinner',
    prayer: 'bedtime',
  };
  const slot = slotMap[activity];
  if (!slot) return slotCompletions;
  const next = { ...slotCompletions, [slot]: { ...slotCompletions[slot], [day]: todayISO } };
  return next;
}

export const useProgress = create<ProgressState>()(
  persist(
    (set) => ({
      completedDays: {},
      devotionalDays: {},
      prayerDays: {},
      practicedWeeks: {},
      slotCompletions: { ...EMPTY_SLOTS },
      familyChallengesDone: {},

      toggleActivity: (activity, day, todayISO) =>
        set((state) => {
          const key = ACTIVITY_KEY[activity];
          const next = { ...state[key] };
          let slotCompletions = state.slotCompletions;
          if (next[day]) {
            delete next[day];
            const slot =
              activity === 'reading' ? 'morning' : activity === 'devotional' ? 'dinner' : 'bedtime';
            const slotNext = { ...slotCompletions[slot] };
            delete slotNext[day];
            slotCompletions = { ...slotCompletions, [slot]: slotNext };
          } else {
            next[day] = todayISO;
            slotCompletions = syncSlotFromActivity(activity, day, todayISO, slotCompletions);
          }
          return { [key]: next, slotCompletions };
        }),
      toggleDay: (day, todayISO) =>
        set((state) => {
          const next = { ...state.completedDays };
          let slotCompletions = state.slotCompletions;
          if (next[day]) {
            delete next[day];
            const slotNext = { ...slotCompletions.morning };
            delete slotNext[day];
            slotCompletions = { ...slotCompletions, morning: slotNext };
          } else {
            next[day] = todayISO;
            slotCompletions = syncSlotFromActivity('reading', day, todayISO, slotCompletions);
          }
          return { completedDays: next, slotCompletions };
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
      markSlotComplete: (slot, day, todayISO) =>
        set((state) => {
          const activity = slotActivity(slot);
          const key = ACTIVITY_KEY[activity];
          const activityNext = { ...state[key], [day]: todayISO };
          const slotNext = { ...state.slotCompletions[slot], [day]: todayISO };
          return {
            [key]: activityNext,
            slotCompletions: { ...state.slotCompletions, [slot]: slotNext },
          };
        }),
      toggleFamilyChallenge: (day) =>
        set((state) => {
          const next = { ...state.familyChallengesDone };
          if (next[day]) delete next[day];
          else next[day] = true;
          return { familyChallengesDone: next };
        }),
      resetProgress: () =>
        set({
          completedDays: {},
          devotionalDays: {},
          prayerDays: {},
          practicedWeeks: {},
          slotCompletions: { ...EMPTY_SLOTS },
          familyChallengesDone: {},
        }),
      applyImportedProgress: (partial) =>
        set((state) => ({
          completedDays: partial.completedDays ?? state.completedDays,
          devotionalDays: partial.devotionalDays ?? state.devotionalDays,
          prayerDays: partial.prayerDays ?? state.prayerDays,
          practicedWeeks: partial.practicedWeeks ?? state.practicedWeeks,
          slotCompletions: partial.slotCompletions ?? state.slotCompletions,
          familyChallengesDone: partial.familyChallengesDone ?? state.familyChallengesDone,
        })),
    }),
    {
      name: 'ff-progress',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as ProgressState;
        if (version < 1) {
          if (!state.slotCompletions) {
            state.slotCompletions = {
              morning: { ...state.completedDays },
              dinner: { ...state.devotionalDays },
              bedtime: { ...state.prayerDays },
            };
          }
          if (!state.familyChallengesDone) state.familyChallengesDone = {};
        }
        return state;
      },
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
