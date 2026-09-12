/**
 * Catch-up detection — gentle, no-guilt prompts when life gets messy.
 */
import { currentPlanDay } from '@/lib/dates';

export type CatchUpChoice = 'continue' | 'today-only';

export interface CatchUpStatus {
  /** Calendar days since plan started (1 on start day). */
  calendarDays: number;
  /** Current plan day number based on calendar. */
  planDay: number;
  /** Last plan day with any activity completed. */
  lastCompletedDay: number;
  /** How many plan days behind the calendar the family is. */
  daysBehind: number;
  /** True when the family is more than one day behind. */
  shouldOfferCatchUp: boolean;
}

/** Days between two local YYYY-MM-DD strings, inclusive of start day as day 1. */
export function calendarDaysSinceStart(planStartISO: string, todayISO: string): number {
  const start = new Date(`${planStartISO}T12:00:00`);
  const today = new Date(`${todayISO}T12:00:00`);
  const diff = Math.round((today.getTime() - start.getTime()) / 86_400_000);
  return Math.max(1, diff + 1);
}

/** Highest plan day with any completion across the three activities. */
export function lastCompletedDay(progress: {
  completedDays: Record<number, string>;
  devotionalDays: Record<number, string>;
  prayerDays: Record<number, string>;
}): number {
  const days = [
    ...Object.keys(progress.completedDays),
    ...Object.keys(progress.devotionalDays),
    ...Object.keys(progress.prayerDays),
  ].map(Number);
  return days.length === 0 ? 0 : Math.max(...days);
}

export function catchUpStatus(
  planStartISO: string,
  todayISO: string,
  progress: {
    completedDays: Record<number, string>;
    devotionalDays: Record<number, string>;
    prayerDays: Record<number, string>;
  },
  catchUpChoice: CatchUpChoice | null = null
): CatchUpStatus {
  const calendarDays = calendarDaysSinceStart(planStartISO, todayISO);
  const planDay = currentPlanDay(planStartISO, todayISO);
  const lastDone = lastCompletedDay(progress);
  const daysBehind = Math.max(0, planDay - lastDone);
  const shouldOfferCatchUp = daysBehind > 1 && catchUpChoice !== 'today-only';

  return { calendarDays, planDay, lastCompletedDay: lastDone, daysBehind, shouldOfferCatchUp };
}

/** Plan day to show when catch-up mode is "today only" — stays on calendar day. */
export function effectivePlanDay(
  planStartISO: string,
  todayISO: string,
  catchUpChoice: CatchUpChoice | null
): number {
  if (catchUpChoice === 'today-only') {
    return Math.min(365, calendarDaysSinceStart(planStartISO, todayISO));
  }
  return currentPlanDay(planStartISO, todayISO);
}
