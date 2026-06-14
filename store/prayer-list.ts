import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface PrayerRequest {
  id: string;
  /** Who or what we're praying for. */
  title: string;
  /** Optional detail ("Grandma's surgery on Friday"). */
  note: string;
  createdAt: string;
  /** Set when the family marks the prayer as answered. */
  answeredAt: string | null;
  /** Optional note about how God answered. */
  answeredNote: string;
}

interface PrayerListState {
  requests: PrayerRequest[];
  addRequest: (title: string, note: string) => void;
  markAnswered: (id: string, answeredNote: string) => void;
  reopenRequest: (id: string) => void;
  removeRequest: (id: string) => void;
}

export const usePrayerList = create<PrayerListState>()(
  persist(
    (set) => ({
      requests: [],
      addRequest: (title, note) =>
        set((state) => ({
          requests: [
            {
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              title: title.trim(),
              note: note.trim(),
              createdAt: new Date().toISOString(),
              answeredAt: null,
              answeredNote: '',
            },
            ...state.requests,
          ],
        })),
      markAnswered: (id, answeredNote) =>
        set((state) => ({
          requests: state.requests.map((r) =>
            r.id === id ? { ...r, answeredAt: new Date().toISOString(), answeredNote } : r
          ),
        })),
      reopenRequest: (id) =>
        set((state) => ({
          requests: state.requests.map((r) =>
            r.id === id ? { ...r, answeredAt: null, answeredNote: '' } : r
          ),
        })),
      removeRequest: (id) =>
        set((state) => ({ requests: state.requests.filter((r) => r.id !== id) })),
    }),
    {
      name: 'ff-prayer-list',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
