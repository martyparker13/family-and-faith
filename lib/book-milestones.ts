/**
 * Detect Bible book completions from reading-plan progress.
 */
import { readingPlan } from '@/lib/content';

/** Canonical book name from a passage reference, e.g. "Genesis 1–2" → "Genesis". */
export function bookFromReference(reference: string): string {
  const trimmed = reference.trim();
  const match = trimmed.match(/^(\d?\s?[A-Za-z]+)/);
  if (!match) return trimmed;
  return match[1].replace(/\s+/g, ' ').trim();
}

/** Last plan day that includes each book (based on bundled reading plan). */
export function lastPlanDayByBook(): Record<string, number> {
  const lastDay: Record<string, number> = {};
  for (const planDay of readingPlan) {
    for (const passage of planDay.passages) {
      const book = bookFromReference(passage.reference);
      lastDay[book] = planDay.day;
    }
  }
  return lastDay;
}

/** Books whose final reading day is in completedDays. */
export function completedBooks(completedDays: Record<number, string>): string[] {
  const lastDay = lastPlanDayByBook();
  return Object.entries(lastDay)
    .filter(([, day]) => Boolean(completedDays[day]))
    .map(([book]) => book)
    .sort((a, b) => a.localeCompare(b));
}

/** Books newly completed when `day` was just marked done. */
export function newlyCompletedBooks(
  completedDays: Record<number, string>,
  day: number
): string[] {
  if (!completedDays[day]) return [];
  const lastDay = lastPlanDayByBook();
  return Object.entries(lastDay)
    .filter(([, lastPlanDay]) => lastPlanDay === day)
    .map(([book]) => book);
}

/** Most recent book completion for Today badge (highest plan day). */
export function latestBookCompletion(
  completedDays: Record<number, string>,
  celebratedBooks: Record<string, string>
): { book: string; day: number } | null {
  const lastDay = lastPlanDayByBook();
  let best: { book: string; day: number } | null = null;
  for (const [book, day] of Object.entries(lastDay)) {
    if (!completedDays[day]) continue;
    if (celebratedBooks[book]) continue;
    if (!best || day > best.day) best = { book, day };
  }
  return best;
}
