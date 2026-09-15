import { buildFamilyBackup, exportYearKeepsake } from '@/lib/export-data';
import { mergeBackupIntoLocal, parseFamilyBackup, deepLinkToRoute } from '@/lib/import-data';

const baseStores = {
  settings: {
    familyName: 'Test Family',
    onboarded: true,
    planStartDate: '2026-06-01',
    morningReminder: { hour: 7, minute: 0 },
    dinnerReminder: null,
    bedtimeReminder: null,
    children: [],
    seasonalOverlaysEnabled: true,
    catchUpChoice: null,
    themePreference: 'system' as const,
    textScaleIndex: 1,
    speechRate: 'normal' as const,
    setFamilyName: () => {},
    completeOnboarding: () => {},
    setPlanStartDate: () => {},
    setMorningReminder: () => {},
    setDinnerReminder: () => {},
    setBedtimeReminder: () => {},
    setRhythmReminders: () => {},
    setReminder: () => {},
    setChildren: () => {},
    addChild: () => {},
    removeChild: () => {},
    setSeasonalOverlaysEnabled: () => {},
    setCatchUpChoice: () => {},
    setThemePreference: () => {},
    setTextScaleIndex: () => {},
    setSpeechRate: () => {},
    vacationMode: { active: false },
    sundayNotes: {},
    dismissedDisciplingTips: [],
    language: 'device' as const,
    setLanguage: () => {},
    setVacationMode: () => {},
    resumeFromVacation: () => {},
    setSundayNote: () => {},
    dismissDisciplingTip: () => {},
    replayOnboarding: () => {},
    applyImportedSettings: () => {},
  },
  progress: {
    completedDays: { 1: '2026-06-01' },
    devotionalDays: {},
    prayerDays: {},
    practicedWeeks: {},
    slotCompletions: { morning: { 1: '2026-06-01' }, dinner: {}, bedtime: {} },
    familyChallengesDone: { 1: true },
  },
  journal: {},
  favorites: [],
  prayerList: [],
};

describe('buildFamilyBackup', () => {
  it('includes version and progress', () => {
    const backup = buildFamilyBackup(baseStores);
    expect(backup.version).toBe(2);
    expect(backup.progress.completedDays[1]).toBe('2026-06-01');
  });
});

describe('exportYearKeepsake', () => {
  it('produces markdown with family name', () => {
    const md = exportYearKeepsake(baseStores);
    expect(md).toContain('Test Family');
    expect(md).toContain('Bible');
  });
});

describe('parseFamilyBackup', () => {
  it('parses valid backup JSON', () => {
    const backup = buildFamilyBackup(baseStores);
    const result = parseFamilyBackup(JSON.stringify(backup));
    expect(result.ok).toBe(true);
  });

  it('rejects invalid JSON', () => {
    expect(parseFamilyBackup('not json').ok).toBe(false);
  });
});

describe('mergeBackupIntoLocal', () => {
  it('keeps newer timestamps', () => {
    const backup = buildFamilyBackup(baseStores);
    backup.progress.completedDays[1] = '2026-06-10';
    const merged = mergeBackupIntoLocal(
      {
        journal: {},
        favorites: [],
        prayerList: [],
        progress: {
          completedDays: { 1: '2026-06-05' },
          devotionalDays: {},
          prayerDays: {},
          practicedWeeks: {},
          slotCompletions: { morning: {}, dinner: {}, bedtime: {} },
          familyChallengesDone: {},
        },
      },
      backup
    );
    expect(merged.progress.completedDays[1]).toBe('2026-06-10');
  });
});

describe('deepLinkToRoute', () => {
  it('routes rhythm deep links', () => {
    expect(deepLinkToRoute('faithandfamily://rhythm/morning')).toBe('/rhythm/morning');
    expect(deepLinkToRoute('faithandfamily://rhythm/bedtime')).toBe('/rhythm/bedtime');
  });
});
