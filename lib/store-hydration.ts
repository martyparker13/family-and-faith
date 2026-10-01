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

const HYDRATION_TIMEOUT_MS = 8_000;

/** True when every persisted store has finished hydrating. */
export function allStoresHydrated(): boolean {
  try {
    return PERSISTED_STORES.every((store) => store.persist.hasHydrated());
  } catch {
    // A persist API failure must not block first paint forever.
    return true;
  }
}

/**
 * Resolves once all persisted stores have hydrated. If already hydrated,
 * resolves immediately. Times out so a stuck AsyncStorage read cannot
 * leave the production splash up forever.
 */
export function waitForAllStoresHydrated(): Promise<void> {
  try {
    if (allStoresHydrated()) return Promise.resolve();
  } catch {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      unsubs.forEach((u) => {
        try {
          u();
        } catch {
          // ignore
        }
      });
      resolve();
    };

    const unsubs: (() => void)[] = [];
    const check = () => {
      if (allStoresHydrated()) finish();
    };
    try {
      for (const store of PERSISTED_STORES) {
        if (store.persist.hasHydrated()) continue;
        unsubs.push(store.persist.onFinishHydration(check));
      }
    } catch {
      finish();
      return;
    }
    const timeout = setTimeout(finish, HYDRATION_TIMEOUT_MS);
    unsubs.push(() => clearTimeout(timeout));
    check();
  });
}
