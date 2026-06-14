/**
 * Memory verse of the week, derived from the bundled devotional content so
 * no extra content file is needed. Each plan week (days 1–7 = week 0, …)
 * uses the anchor verse from that week's first devotional — verses were
 * curated to be short, central, and memorizable.
 */
import { getDevotional } from './content';

export interface MemoryVerse {
  /** 0-based week index within the 365-day plan. */
  week: number;
  reference: string;
  text: string;
}

/** The memory verse for the week containing the given plan day. */
export function memoryVerseForDay(day: number): MemoryVerse {
  const clamped = Math.min(365, Math.max(1, Math.round(day)));
  const week = Math.floor((clamped - 1) / 7);
  const firstDayOfWeek = week * 7 + 1;
  const devotional = getDevotional(firstDayOfWeek);
  return {
    week,
    reference: devotional.scripture.reference,
    text: devotional.scripture.text,
  };
}
