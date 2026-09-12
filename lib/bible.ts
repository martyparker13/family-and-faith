/**
 * Fetches chapter text from bible-api.com (World English Bible, public
 * domain) with a permanent AsyncStorage cache so a passage only needs the
 * network once — after that the day's reading works fully offline.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface BibleVerse {
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

export interface PassageText {
  reference: string;
  verses: BibleVerse[];
}

const CACHE_PREFIX = 'ff-bible:';
const FETCH_TIMEOUT_MS = 15_000;

interface ApiVerse {
  book_name: string;
  chapter: number;
  verse: number;
  text: string;
}

function isValidPassage(value: unknown): value is PassageText {
  if (!value || typeof value !== 'object') return false;
  const p = value as PassageText;
  return typeof p.reference === 'string' && Array.isArray(p.verses);
}

function isValidApiResponse(data: unknown): data is { reference: string; verses: ApiVerse[] } {
  if (!data || typeof data !== 'object') return false;
  const d = data as { reference?: unknown; verses?: unknown };
  return typeof d.reference === 'string' && Array.isArray(d.verses);
}

async function readCachedPassage(cacheKey: string): Promise<PassageText | null> {
  const cached = await AsyncStorage.getItem(cacheKey);
  if (!cached) return null;
  try {
    const parsed: unknown = JSON.parse(cached);
    if (!isValidPassage(parsed)) {
      await AsyncStorage.removeItem(cacheKey);
      return null;
    }
    return parsed;
  } catch {
    await AsyncStorage.removeItem(cacheKey);
    return null;
  }
}

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { signal: controller.signal });
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      throw new Error('Could not load passage (timed out). Check your connection and try again.');
    }
    throw e;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Loads a passage by bible-api query (e.g. "genesis 1-2", "psalms 23").
 * Returns cached text when available; otherwise fetches and caches.
 */
export async function fetchPassage(apiQuery: string): Promise<PassageText> {
  const cacheKey = CACHE_PREFIX + apiQuery;
  const fromCache = await readCachedPassage(cacheKey);
  if (fromCache) return fromCache;

  const url = `https://bible-api.com/${encodeURIComponent(apiQuery)}?translation=web`;
  const res = await fetchWithTimeout(url);
  if (!res.ok) {
    throw new Error(`Could not load passage (${res.status}). Check your connection and try again.`);
  }

  const data: unknown = await res.json();
  if (!isValidApiResponse(data) || data.verses.length === 0) {
    throw new Error('Could not load passage (unexpected response). Try again later.');
  }

  const passage: PassageText = {
    reference: data.reference,
    verses: data.verses.map((v) => ({
      book: v.book_name,
      chapter: v.chapter,
      verse: v.verse,
      text: v.text.replace(/\s+/g, ' ').trim(),
    })),
  };

  await AsyncStorage.setItem(cacheKey, JSON.stringify(passage));
  return passage;
}

/** True when the passage is already cached (i.e. readable offline). */
export async function isPassageCached(apiQuery: string): Promise<boolean> {
  return (await readCachedPassage(CACHE_PREFIX + apiQuery)) != null;
}

/** Removes every cached chapter (Settings → free up space / fresh start). */
export async function clearBibleCache(): Promise<number> {
  const keys = await AsyncStorage.getAllKeys();
  const bibleKeys = keys.filter((k) => k.startsWith(CACHE_PREFIX));
  if (bibleKeys.length > 0) {
    await AsyncStorage.multiRemove(bibleKeys);
  }
  return bibleKeys.length;
}

/**
 * Fetches a multi-chapter passage (bible-api serves one chapter per request)
 * and merges the chapters into a single PassageText for rendering.
 */
export async function fetchPassageGroup(
  reference: string,
  apiQueries: string[]
): Promise<PassageText> {
  const chapters = await Promise.all(apiQueries.map((q) => fetchPassage(q)));
  return { reference, verses: chapters.flatMap((c) => c.verses) };
}

/**
 * Groups a passage's verses by chapter for rendering chapter headings,
 * preserving verse order within each chapter.
 */
export function groupByChapter(passage: PassageText): { chapter: string; verses: BibleVerse[] }[] {
  const groups: { chapter: string; verses: BibleVerse[] }[] = [];
  for (const verse of passage.verses) {
    const label = `${verse.book} ${verse.chapter}`;
    const last = groups[groups.length - 1];
    if (last && last.chapter === label) {
      last.verses.push(verse);
    } else {
      groups.push({ chapter: label, verses: [verse] });
    }
  }
  return groups;
}
