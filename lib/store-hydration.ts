/**
 * Waits for every persisted Zustand store to finish rehydrating from
 * AsyncStorage before the main UI mounts — avoids flash of empty progress,
 * journal entries, favorites, or prayer requests on cold start.
 */
import { useFavorites } from '@/store/favorites';
import { useJournal } from '@/store/journal';
import { usePrayerList } from '@/store/prayer-list';
import { useProgress } from '@/store/progress';
import { useSettings } from '@/store/settings';

const PERSISTED_STORES = [
  useSettings,
  useProgress,
  useJournal,
  useFavorites,
  usePrayerList,
] as const;

/** True when every persisted store has finished hydrating. */
export function allStoresHydrated(): boolean {
  return PERSISTED_STORES.every((store) => store.persist.hasHydrated());
}

/**
 * Resolves once all persisted stores have hydrated. If already hydrated,
 * resolves immediately.
 */
export function waitForAllStoresHydrated(): Promise<void> {
  if (allStoresHydrated()) return Promise.resolve();

  return new Promise((resolve) => {
    const unsubs: (() => void)[] = [];
    const check = () => {
      if (allStoresHydrated()) {
        unsubs.forEach((u) => u());
        resolve();
      }
    };
    for (const store of PERSISTED_STORES) {
      if (store.persist.hasHydrated()) continue;
      unsubs.push(store.persist.onFinishHydration(check));
    }
    check();
  });
}
