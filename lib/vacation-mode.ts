/**
 * Vacation / travel mode — pause reminders, suppress catch-up guilt, freeze streaks.
 */
import { t } from '@/i18n/index';
import { currentStreak } from '@/store/progress';

export interface VacationMode {
  active: boolean;
  startDate?: string;
  endDate?: string;
}

export const DEFAULT_VACATION_MODE: VacationMode = { active: false };

/** True when vacation mode covers today (local YYYY-MM-DD). */
export function isVacationActive(mode: VacationMode, todayISO: string): boolean {
  if (!mode.active) return false;
  if (mode.startDate && todayISO < mode.startDate) return false;
  if (mode.endDate && todayISO > mode.endDate) return false;
  return true;
}

/** Catch-up banner is hidden while on vacation. */
export function shouldSuppressCatchUp(mode: VacationMode, todayISO: string): boolean {
  return isVacationActive(mode, todayISO);
}

/** Rhythm reminders should not fire during vacation. */
export function shouldPauseReminders(mode: VacationMode, todayISO: string): boolean {
  return isVacationActive(mode, todayISO);
}

function dayBefore(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() - 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Streak frozen at its value the day before vacation started — does not break
 * or increment while vacation is active.
 */
export function effectiveStreak(
  dates: Iterable<string>,
  todayISO: string,
  mode: VacationMode
): number {
  if (!isVacationActive(mode, todayISO)) {
    return currentStreak(dates, todayISO);
  }
  const anchor = mode.startDate ? dayBefore(mode.startDate) : dayBefore(todayISO);
  return currentStreak(dates, anchor);
}

/** Validates optional date range when enabling vacation mode. */
export function validateVacationMode(mode: VacationMode): string | null {
  if (!mode.active) return null;
  if (mode.startDate && mode.endDate && mode.startDate > mode.endDate) {
    return t('vacationMode.endDateError');
  }
  return null;
}
