/**
 * Seasonal overlays — optional reading/devotional/prayer accents by date.
 */
import adventEn from '@/content/seasonal/advent.json';
import adventEs from '@/content/seasonal/advent.es.json';
import { getLocale, type AppLocale } from '@/i18n/index';

export interface SeasonalDay {
  week: number;
  label: string;
  readingNote?: string;
  devotionalNote?: string;
  prayerNote?: string;
}

export interface SeasonalOverlay {
  id: string;
  name: string;
  startMonthDay: string;
  endMonthDay: string;
  days: SeasonalDay[];
}

const OVERLAYS_BY_LOCALE: Record<AppLocale, SeasonalOverlay[]> = {
  en: [adventEn as SeasonalOverlay],
  es: [mergeSeasonalOverlay(adventEn as SeasonalOverlay, adventEs as SeasonalOverlay)],
};

function mergeSeasonalOverlay(en: SeasonalOverlay, es: SeasonalOverlay): SeasonalOverlay {
  const esDays = new Map(es.days.map((d) => [d.week, d]));
  return {
    id: en.id,
    name: es.name || en.name,
    startMonthDay: en.startMonthDay,
    endMonthDay: en.endMonthDay,
    days: en.days.map((day) => {
      const translated = esDays.get(day.week);
      if (!translated) return day;
      return {
        week: day.week,
        label: translated.label || day.label,
        readingNote: translated.readingNote ?? day.readingNote,
        devotionalNote: translated.devotionalNote ?? day.devotionalNote,
        prayerNote: translated.prayerNote ?? day.prayerNote,
      };
    }),
  };
}

export function getSeasonalOverlays(locale?: AppLocale): SeasonalOverlay[] {
  const loc = locale ?? getLocale();
  return OVERLAYS_BY_LOCALE[loc] ?? OVERLAYS_BY_LOCALE.en;
}

/** @deprecated Use getSeasonalOverlays() */
export const SEASONAL_OVERLAYS: SeasonalOverlay[] = getSeasonalOverlays('en');

function monthDay(iso: string): string {
  return iso.slice(5, 10);
}

/** True when date falls in [start, end], wrapping year boundary if needed. */
export function isDateInRange(dateMD: string, startMD: string, endMD: string): boolean {
  if (startMD <= endMD) {
    return dateMD >= startMD && dateMD <= endMD;
  }
  return dateMD >= startMD || dateMD <= endMD;
}

export function activeSeasonalOverlay(
  todayISO: string,
  enabled: boolean,
  locale?: AppLocale
): SeasonalOverlay | null {
  if (!enabled) return null;
  const md = monthDay(todayISO);
  for (const overlay of getSeasonalOverlays(locale)) {
    if (isDateInRange(md, overlay.startMonthDay, overlay.endMonthDay)) {
      return overlay;
    }
  }
  return null;
}

/** Week index (1-based) within an overlay for today. */
export function seasonalWeek(overlay: SeasonalOverlay, todayISO: string): number {
  const md = monthDay(todayISO);
  const start = overlay.startMonthDay;
  const end = overlay.endMonthDay;

  const year = parseInt(todayISO.slice(0, 4), 10);
  const startDate = new Date(`${year}-${start}T12:00:00`);
  let today = new Date(`${todayISO}T12:00:00`);

  if (start > end && md <= end) {
    startDate.setFullYear(year - 1);
  }
  if (today < startDate) {
    today = new Date(`${year + 1}-${md}T12:00:00`);
  }

  const diffDays = Math.floor((today.getTime() - startDate.getTime()) / 86_400_000);
  const week = Math.floor(diffDays / 7) + 1;
  return Math.min(Math.max(1, week), overlay.days.length);
}

export function seasonalDayInfo(
  overlay: SeasonalOverlay,
  todayISO: string
): SeasonalDay | null {
  const week = seasonalWeek(overlay, todayISO);
  return overlay.days.find((d) => d.week === week) ?? overlay.days[overlay.days.length - 1];
}
