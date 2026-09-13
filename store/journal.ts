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
  /** Local file URI for a voice note (expo-file-system). */
  voiceUri?: string;
  /** Voice note length in milliseconds. */
  voiceDurationMs?: number;
}

/**
 * The family Bible journal: one short note per plan day. After a year this
 * becomes a keepsake — a written record of a family's walk through the Bible.
 */
interface JournalState {
  entries: Record<number, JournalEntry>;
  saveEntry: (
    day: number,
    note: string,
    dateISO: string,
    voice?: { voiceUri?: string; voiceDurationMs?: number }
  ) => void;
  removeEntry: (day: number) => void;
}

export const useJournal = create<JournalState>()(
  persist(
    (set) => ({
      entries: {},
      saveEntry: (day, note, dateISO, voice) =>
        set((state) => {
          const trimmed = note.trim();
          const prev = state.entries[day];
          const hasVoice = Boolean(voice?.voiceUri ?? prev?.voiceUri);
          const next = { ...state.entries };
          if (trimmed || hasVoice) {
            next[day] = {
              day,
              note: trimmed,
              dateISO,
              voiceUri: voice?.voiceUri ?? prev?.voiceUri,
              voiceDurationMs: voice?.voiceDurationMs ?? prev?.voiceDurationMs,
            };
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
      version: 1,
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as JournalState;
        if (version < 1) {
          if (!state.entries) state.entries = {};
        }
        return state;
      },
    }
  )
);
