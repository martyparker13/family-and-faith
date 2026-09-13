import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

function shuffled365(): number[] {
  const arr = Array.from({ length: 365 }, (_, i) => i);
  for (let i = 364; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

interface DailyContentState {
  /** Shuffled 0-based indices into the devotionals/prayers arrays. */
  sequence: number[];
  /** Current position in the sequence (0–364). */
  position: number;
  /** ISO date the position was last advanced — '' on first install. */
  lastAdvancedDate: string;
  /** ISO date devotional was completed today, or null if not done. */
  devotionalDoneDate: string | null;
  /** ISO date prayer was completed today, or null if not done. */
  prayerDoneDate: string | null;

  advance: (todayISO: string) => void;
  markDevotionalDone: (date: string) => void;
  unmarkDevotionalDone: () => void;
  markPrayerDone: (date: string) => void;
  unmarkPrayerDone: () => void;
  resetDailyContent: () => void;
}

function makeInitial() {
  return {
    sequence: shuffled365(),
    position: 0,
    lastAdvancedDate: '',
    devotionalDoneDate: null as string | null,
    prayerDoneDate: null as string | null,
  };
}

export const useDailyContent = create<DailyContentState>()(
  persist(
    (set) => ({
      ...makeInitial(),

      advance: (date) =>
        set((s) => {
          // First ever call: start at position 0, just record today's date.
          if (s.lastAdvancedDate === '') {
            return { lastAdvancedDate: date, devotionalDoneDate: null, prayerDoneDate: null };
          }
          const next = (s.position + 1) % 365;
          return {
            // Re-shuffle when the full cycle wraps so there are no repeats within a cycle.
            sequence: next === 0 ? shuffled365() : s.sequence,
            position: next,
            lastAdvancedDate: date,
            devotionalDoneDate: null,
            prayerDoneDate: null,
          };
        }),

      markDevotionalDone: (date) => set({ devotionalDoneDate: date }),
      unmarkDevotionalDone: () => set({ devotionalDoneDate: null }),
      markPrayerDone: (date) => set({ prayerDoneDate: date }),
      unmarkPrayerDone: () => set({ prayerDoneDate: null }),
      resetDailyContent: () => set(makeInitial()),
    }),
    {
      name: 'ff-daily-content',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

/** 1-based content index passed to getDevotional() / getPrayer(). */
export function todayContentIndex(s: Pick<DailyContentState, 'sequence' | 'position'>): number {
  return s.sequence[s.position] + 1;
}
