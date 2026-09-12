/**
 * Weekly recap — summaries for Sunday family reflection.
 */
import { getDevotional, getPlanDay } from '@/lib/content';
import { dateForPlanDay, isoToDate } from '@/lib/dates';
import type { JournalEntry } from '@/store/journal';

export interface WeeklyRecapDay {
  day: number;
  dateLabel: string;
  references: string;
  theme: string;
  journalNote: string | null;
}

export interface WeeklyRecap {
  weekLabel: string;
  startDay: number;
  endDay: number;
  days: WeeklyRecapDay[];
  themes: string[];
  journalCount: number;
  answeredPrayerCount: number;
}

function weekStartPlanDay(planStartISO: string, todayISO: string): number {
  const today = isoToDate(todayISO);
  const dayOfWeek = today.getDay();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - dayOfWeek);
  const startISO = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;
  const diff = Math.round((isoToDate(startISO).getTime() - isoToDate(planStartISO).getTime()) / 86_400_000);
  return Math.min(365, Math.max(1, diff + 1));
}

/** Build recap for the calendar week containing todayISO. */
export function buildWeeklyRecap(
  planStartISO: string,
  todayISO: string,
  journalEntries: Record<number, JournalEntry>,
  answeredPrayerCount: number
): WeeklyRecap {
  const startDay = weekStartPlanDay(planStartISO, todayISO);
  const endDay = Math.min(365, startDay + 6);

  const days: WeeklyRecapDay[] = [];
  const themes = new Set<string>();
  let journalCount = 0;

  for (let day = startDay; day <= endDay; day++) {
    const plan = getPlanDay(day);
    const devotional = getDevotional(day);
    themes.add(devotional.theme);
    const journal = journalEntries[day];
    if (journal?.note) journalCount += 1;

    days.push({
      day,
      dateLabel: planStartISO
        ? dateForPlanDay(planStartISO, day).toLocaleDateString(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          })
        : `Day ${day}`,
      references: plan.passages.map((p) => p.reference).join(' · '),
      theme: devotional.theme,
      journalNote: journal?.note ?? null,
    });
  }

  const weekStart = planStartISO ? dateForPlanDay(planStartISO, startDay) : null;
  const weekEnd = planStartISO ? dateForPlanDay(planStartISO, endDay) : null;
  const weekLabel =
    weekStart && weekEnd
      ? `${weekStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${weekEnd.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
      : `Days ${startDay}–${endDay}`;

  return {
    weekLabel,
    startDay,
    endDay,
    days,
    themes: [...themes],
    journalCount,
    answeredPrayerCount,
  };
}

/** True on Sundays (local) — when we surface the recap link. */
export function isRecapDay(todayISO: string): boolean {
  return isoToDate(todayISO).getDay() === 0;
}
