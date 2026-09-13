/**
 * Export family data for backup, share sheet export, and year-end keepsake.
 */
import { Share } from 'react-native';

import { getDevotional, getPlanDay } from '@/lib/content';
import { percentComplete } from '@/store/progress';
import type { FavoriteVerse } from '@/store/favorites';
import { useFavorites } from '@/store/favorites';
import type { JournalEntry } from '@/store/journal';
import { useJournal } from '@/store/journal';
import type { PrayerRequest } from '@/store/prayer-list';
import { usePrayerList } from '@/store/prayer-list';
import { useProgress } from '@/store/progress';
import type { SettingsState } from '@/store/settings';
import { useSettings } from '@/store/settings';

export const BACKUP_VERSION = 2;

export interface FamilyBackup {
  version: number;
  exportedAt: string;
  settings: Partial<SettingsState>;
  progress: {
    completedDays: Record<number, string>;
    devotionalDays: Record<number, string>;
    prayerDays: Record<number, string>;
    practicedWeeks: Record<number, string>;
    slotCompletions: {
      morning: Record<number, string>;
      dinner: Record<number, string>;
      bedtime: Record<number, string>;
    };
    familyChallengesDone: Record<number, boolean>;
    familyChallengeNotes?: Record<number, { note?: string; photoUri?: string }>;
    prayerParticipation?: Record<number, { taps: number; childIds?: string[] }>;
    celebratedBookMilestones?: Record<string, string>;
  };
  journal: Record<number, JournalEntry>;
  kidQuestions?: import('@/store/kid-questions').KidQuestion[];
  favorites: FavoriteVerse[];
  prayerList: PrayerRequest[];
}

export interface ExportStores {
  settings: SettingsState;
  progress: FamilyBackup['progress'] & {
    familyChallengeNotes?: Record<number, { note?: string; photoUri?: string }>;
  };
  journal: Record<number, JournalEntry>;
  favorites: FavoriteVerse[];
  prayerList: PrayerRequest[];
}

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

/** Full backup JSON for import on another device. */
export function buildFamilyBackup(stores: ExportStores): FamilyBackup {
  const { settings, progress, journal, favorites, prayerList } = stores;
  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    settings: {
      familyName: settings.familyName,
      planStartDate: settings.planStartDate,
      morningReminder: settings.morningReminder,
      dinnerReminder: settings.dinnerReminder,
      bedtimeReminder: settings.bedtimeReminder,
      children: settings.children,
      themePreference: settings.themePreference,
      textScaleIndex: settings.textScaleIndex,
      speechRate: settings.speechRate,
      seasonalOverlaysEnabled: settings.seasonalOverlaysEnabled,
      catchUpChoice: settings.catchUpChoice,
      onboarded: settings.onboarded,
      vacationMode: settings.vacationMode,
      sundayNotes: settings.sundayNotes,
      dismissedDisciplingTips: settings.dismissedDisciplingTips,
    },
    progress: {
      ...progress,
      familyChallengeNotes: progress.familyChallengeNotes,
      prayerParticipation: progress.prayerParticipation,
      celebratedBookMilestones: progress.celebratedBookMilestones,
    },
    journal,
    favorites,
    prayerList,
  };
}

/** Markdown keepsake suitable for share/print. */
export function exportYearKeepsake(stores: ExportStores): string {
  const { settings, progress, journal, favorites, prayerList } = stores;
  const family = settings.familyName || 'Our Family';
  const pct = percentComplete(progress.completedDays);
  const answered = prayerList.filter((r) => r.answeredAt);

  const lines: string[] = [
    `# ${family} — Faith & Family Keepsake`,
    '',
    `*Exported ${new Date().toLocaleDateString()}*`,
    '',
    '## Our year in numbers',
    `- **${pct}%** of the Bible read together`,
    `- **${Object.keys(progress.completedDays).length}** reading days`,
    `- **${Object.keys(journal).length}** journal entries`,
    `- **${answered.length}** answered prayers`,
    `- **${favorites.length}** saved favorites`,
    '',
  ];

  if (answered.length > 0) {
    lines.push('## Answered prayers', '');
    for (const r of answered) {
      lines.push(`- **${r.title}**${r.answeredNote ? ` — ${r.answeredNote}` : ''}`);
    }
    lines.push('');
  }

  const journalDays = Object.keys(journal)
    .map(Number)
    .sort((a, b) => a - b);
  const challengeNotes = stores.progress.familyChallengeNotes ?? {};
  const challengeDays = Object.keys(challengeNotes).map(Number).sort((a, b) => a - b);
  if (challengeDays.length > 0) {
    lines.push('## Family challenges', '');
    for (const day of challengeDays) {
      const note = challengeNotes[day];
      if (note?.note) lines.push(`- Day ${day}: ${note.note}`);
    }
    lines.push('');
  }

  if (journalDays.length > 0) {
    lines.push('## Family journal', '');
    for (const day of journalDays) {
      const entry = journal[day];
      const plan = getPlanDay(day);
      lines.push(`### Day ${day} — ${plan.passages[0]?.reference ?? ''}`);
      if (entry.note) lines.push(entry.note);
      if (entry.voiceUri) lines.push('_Voice note saved_');
      lines.push('');
    }
  }

  if (favorites.length > 0) {
    lines.push('## Favorite verses & prayers', '');
    for (const f of favorites.slice(0, 50)) {
      lines.push(`> “${f.text}” — *${f.reference}*`);
      lines.push('');
    }
  }

  lines.push('## Themes we explored', '');
  const themes = new Set<string>();
  for (const day of Object.keys(progress.devotionalDays).map(Number)) {
    themes.add(getDevotional(day).theme);
  }
  lines.push([...themes].slice(0, 30).join(' · ') || '_Keep going — your themes will fill in here._');

  return lines.join('\n');
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
      reminder: settings.morningReminder ?? settings.reminder ?? null,
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
