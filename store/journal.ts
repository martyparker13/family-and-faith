import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface JournalEntry {
  /** Plan day (1–365) the note belongs to. */
  day: number;
  /** What the family talked about, noticed, or prayed. */
  note: string;
  /** Local YYYY-MM-DD the note was written/updated. */
  dateISO: string;
}

/**
 * The family Bible journal: one short note per plan day. After a year this
 * becomes a keepsake — a written record of a family's walk through the Bible.
 */
interface JournalState {
  entries: Record<number, JournalEntry>;
  saveEntry: (day: number, note: string, dateISO: string) => void;
  removeEntry: (day: number) => void;
}

export const useJournal = create<JournalState>()(
  persist(
    (set) => ({
      entries: {},
      saveEntry: (day, note, dateISO) =>
        set((state) => {
          const trimmed = note.trim();
          const next = { ...state.entries };
          if (trimmed) {
            next[day] = { day, note: trimmed, dateISO };
          } else {
            delete next[day];
          }
          return { entries: next };
        }),
      removeEntry: (day) =>
        set((state) => {
          const next = { ...state.entries };
          delete next[day];
          return { entries: next };
        }),
    }),
    {
      name: 'ff-journal',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
