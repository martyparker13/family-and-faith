import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface FavoriteVerse {
  /**
   * Stable id — normalized reference for verses ("philippians-4-6") or
   * "prayer-day-42" for daily prayers.
   */
  id: string;
  reference: string;
  text: string;
  /** Topic name it was saved from, when applicable. */
  topic?: string;
  /** Entries saved before prayers were supported have no kind — they're verses. */
  kind?: 'verse' | 'prayer';
  /** Plan day, for daily-prayer favorites (the prayer text lives in content/). */
  day?: number;
  savedAt: string;
}

interface FavoritesState {
  favorites: FavoriteVerse[];
  isFavorite: (id: string) => boolean;
  toggleFavorite: (verse: Omit<FavoriteVerse, 'savedAt'>) => void;
  removeFavorite: (id: string) => void;
}

export const useFavorites = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],
      isFavorite: (id) => get().favorites.some((f) => f.id === id),
      toggleFavorite: (verse) =>
        set((state) => {
          if (state.favorites.some((f) => f.id === verse.id)) {
            return { favorites: state.favorites.filter((f) => f.id !== verse.id) };
          }
          return {
            favorites: [{ ...verse, savedAt: new Date().toISOString() }, ...state.favorites],
          };
        }),
      removeFavorite: (id) =>
        set((state) => ({ favorites: state.favorites.filter((f) => f.id !== id) })),
    }),
    {
      name: 'ff-favorites',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

/** Stable favorite id for a daily prayer. */
export function prayerFavoriteId(day: number): string {
  return `prayer-day-${day}`;
}

/** Builds a stable favorite id from a scripture reference. */
export function verseId(reference: string): string {
  return reference
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
