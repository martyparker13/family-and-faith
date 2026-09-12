import { buildFamilyDataExport } from '@/lib/export-data';
import { useFavorites } from '@/store/favorites';
import { useJournal } from '@/store/journal';
import { usePrayerList } from '@/store/prayer-list';
import { useProgress } from '@/store/progress';
import { useSettings } from '@/store/settings';

beforeEach(() => {
  useSettings.setState({
    familyName: 'Test Family',
    planStartDate: '2026-01-01',
    reminder: { hour: 7, minute: 0 },
    themePreference: 'system',
    textScaleIndex: 1,
    speechRate: 'normal',
    onboarded: true,
  });
  useProgress.setState({
    completedDays: { 1: '2026-01-01' },
    devotionalDays: {},
    prayerDays: {},
    practicedWeeks: {},
    celebratedMilestones: {},
  });
  useJournal.setState({ entries: {} });
  useFavorites.setState({ favorites: [] });
  usePrayerList.setState({ requests: [] });
});

describe('buildFamilyDataExport', () => {
  it('includes all persisted family data sections', () => {
    const payload = buildFamilyDataExport();
    expect(payload.version).toBe(1);
    expect(payload.settings.familyName).toBe('Test Family');
    expect(payload.progress.completedDays[1]).toBe('2026-01-01');
    expect(payload.journal).toEqual({});
    expect(payload.favorites).toEqual([]);
    expect(payload.prayerList).toEqual([]);
    expect(payload.exportedAt).toBeTruthy();
  });
});
