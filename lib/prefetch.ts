/**
 * Download-ahead for daily readings: quietly caches upcoming chapters so the
 * plan keeps working offline (road trips, flights, spotty service).
 *
 * Chapters are fetched one at a time through lib/bible.ts (which writes the
 * permanent AsyncStorage cache) with a small delay between requests to stay
 * polite to the free bible-api.com.
 */
import { fetchPassage, isPassageCached } from './bible';
import { getPlanDay } from './content';

const POLITE_DELAY_MS = 400;

let backgroundPrefetchStarted = false;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Every chapter query for a span of plan days, in order. */
function chapterQueriesForDays(startDay: number, count: number): string[] {
  const queries: string[] = [];
  for (let day = startDay; day < startDay + count && day <= 365; day++) {
    for (const passage of getPlanDay(day).passages) {
      queries.push(...passage.apiQueries);
    }
  }
  return queries;
}

export interface PrefetchProgress {
  done: number;
  total: number;
}

/**
 * Caches every chapter for `count` days starting at `startDay`. Reports
 * progress (already-cached chapters count immediately). Failures on
 * individual chapters are skipped — they'll be fetched on demand later.
 */
export async function prefetchDays(
  startDay: number,
  count: number,
  onProgress?: (p: PrefetchProgress) => void
): Promise<PrefetchProgress> {
  const queries = chapterQueriesForDays(startDay, count);
  const total = queries.length;
  let done = 0;

  for (const query of queries) {
    try {
      if (await isPassageCached(query)) {
        done++;
      } else {
        await fetchPassage(query);
        done++;
        await sleep(POLITE_DELAY_MS);
      }
    } catch {
      // Offline or API hiccup — skip; the reading screen fetches on demand.
    }
    onProgress?.({ done, total });
  }
  return { done, total };
}

/**
 * Fire-and-forget prefetch of the next week, called when the Today screen
 * mounts. Runs at most once per app session.
 */
export function prefetchUpcomingWeek(currentDay: number): void {
  if (backgroundPrefetchStarted) return;
  backgroundPrefetchStarted = true;
  // Deliberately not awaited — this fills the cache in the background.
  prefetchDays(currentDay, 7).catch(() => {
    // Fully offline right now; try again next session.
    backgroundPrefetchStarted = false;
  });
}
