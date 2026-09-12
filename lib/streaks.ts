/**
 * Per-slot streak math — consecutive calendar days a rhythm moment was kept.
 */
import type { RhythmSlot } from '@/lib/rhythm';

/** Unique completion dates for one slot. */
export function slotCompletionDates(completions: Record<number, string>): string[] {
  return [...new Set(Object.values(completions))];
}

/**
 * Streak for a single rhythm slot: consecutive calendar days ending today
 * or yesterday (same grace as the main streak).
 */
export function slotStreak(completions: Record<number, string>, todayISO: string): number {
  const dates = slotCompletionDates(completions);
  if (dates.length === 0) return 0;

  const activeDates = new Set(dates);
  const cursor = new Date(`${todayISO}T12:00:00`);

  if (!activeDates.has(toISO(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!activeDates.has(toISO(cursor))) return 0;
  }

  let streak = 0;
  while (activeDates.has(toISO(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function allSlotStreaks(
  slotCompletions: Record<RhythmSlot, Record<number, string>>,
  todayISO: string
): Record<RhythmSlot, number> {
  return {
    morning: slotStreak(slotCompletions.morning, todayISO),
    dinner: slotStreak(slotCompletions.dinner, todayISO),
    bedtime: slotStreak(slotCompletions.bedtime, todayISO),
  };
}

function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
