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

interface ApiVerse {
  book_name: string;
  chapter: number;
  verse: number;
  text: string;
}

/**
 * Loads a passage by bible-api query (e.g. "genesis 1-2", "psalms 23").
 * Returns cached text when available; otherwise fetches and caches.
 */
export async function fetchPassage(apiQuery: string): Promise<PassageText> {
  const cacheKey = CACHE_PREFIX + apiQuery;
  const cached = await AsyncStorage.getItem(cacheKey);
  if (cached) {
    return JSON.parse(cached) as PassageText;
  }

  const url = `https://bible-api.com/${encodeURIComponent(apiQuery)}?translation=web`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Could not load passage (${res.status}). Check your connection and try again.`);
  }
  const data = (await res.json()) as { reference: string; verses: ApiVerse[] };

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
  return (await AsyncStorage.getItem(CACHE_PREFIX + apiQuery)) != null;
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
