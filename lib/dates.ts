/**
 * Date helpers. The app works in *local* calendar days — a family's "today"
 * is whatever their device says, so all ISO strings here are local
 * YYYY-MM-DD, never UTC.
 */

export function todayISO(): string {
  return dateToISO(new Date());
}

export function dateToISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Parses a local YYYY-MM-DD string to a Date pinned to local noon (avoids DST edges). */
export function isoToDate(iso: string): Date {
  return new Date(`${iso}T12:00:00`);
}

/**
 * Which plan day (1–365) "today" is, given the family's chosen start date.
 * Clamped to 1..365: before the start date it's day 1; after a year it stays
 * at 365 until they restart the plan.
 */
export function currentPlanDay(planStartISO: string, todayISOString: string = todayISO()): number {
  const start = isoToDate(planStartISO);
  const today = isoToDate(todayISOString);
  const diffDays = Math.round((today.getTime() - start.getTime()) / 86_400_000);
  return Math.min(365, Math.max(1, diffDays + 1));
}

/** The calendar date a given plan day falls on. */
export function dateForPlanDay(planStartISO: string, day: number): Date {
  const start = isoToDate(planStartISO);
  start.setDate(start.getDate() + (day - 1));
  return start;
}

/** "Tuesday, June 11" style header date. */
export function formatFriendlyDate(d: Date): string {
  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

/** Short "Jun 11" label for day pickers. */
export function formatShortDate(d: Date): string {
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
