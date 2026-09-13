/**
 * Week keys for Sunday notes and recap grouping.
 */
import { isoToDate } from '@/lib/dates';

/** Sunday-start week key as YYYY-MM-DD (the Sunday date). */
export function weekKeyForDate(todayISO: string): string {
  const today = isoToDate(todayISO);
  const dayOfWeek = today.getDay();
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - dayOfWeek);
  const y = sunday.getFullYear();
  const m = String(sunday.getMonth() + 1).padStart(2, '0');
  const d = String(sunday.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
