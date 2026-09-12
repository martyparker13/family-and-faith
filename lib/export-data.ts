/**
 * Exports all on-device family data as JSON for backup or transfer.
 * Uses the Share API so families can save to Files, email, etc.
 */
import { Share } from 'react-native';

import { useFavorites } from '@/store/favorites';
import { useJournal } from '@/store/journal';
import { usePrayerList } from '@/store/prayer-list';
import { useProgress } from '@/store/progress';
import { useSettings } from '@/store/settings';

export interface FamilyDataExport {
  exportedAt: string;
  version: 1;
  settings: {
    familyName: string;
    planStartDate: string | null;
    reminder: { hour: number; minute: number } | null;
    themePreference: string;
    textScaleIndex: number;
    speechRate: string;
  };
  progress: {
    completedDays: Record<number, string>;
    devotionalDays: Record<number, string>;
    prayerDays: Record<number, string>;
    practicedWeeks: Record<number, string>;
  };
  journal: Record<number, { day: number; note: string; dateISO: string }>;
  favorites: ReturnType<typeof useFavorites.getState>['favorites'];
  prayerList: ReturnType<typeof usePrayerList.getState>['requests'];
}

/** Builds a snapshot of all persisted family data. */
export function buildFamilyDataExport(): FamilyDataExport {
  const settings = useSettings.getState();
  const progress = useProgress.getState();
  const journal = useJournal.getState();
  const favorites = useFavorites.getState();
  const prayerList = usePrayerList.getState();

  return {
    exportedAt: new Date().toISOString(),
    version: 1,
    settings: {
      familyName: settings.familyName,
      planStartDate: settings.planStartDate,
      reminder: settings.reminder,
      themePreference: settings.themePreference,
      textScaleIndex: settings.textScaleIndex,
      speechRate: settings.speechRate,
    },
    progress: {
      completedDays: progress.completedDays,
      devotionalDays: progress.devotionalDays,
      prayerDays: progress.prayerDays,
      practicedWeeks: progress.practicedWeeks,
    },
    journal: journal.entries,
    favorites: favorites.favorites,
    prayerList: prayerList.requests,
  };
}

/** Opens the system share sheet with a JSON backup of family data. */
export async function shareFamilyDataExport(): Promise<void> {
  const payload = buildFamilyDataExport();
  const json = JSON.stringify(payload, null, 2);
  await Share.share({
    message: json,
    title: 'Faith & Family backup',
  });
}
