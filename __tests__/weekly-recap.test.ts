import { buildWeeklyRecap, isRecapDay } from '@/lib/weekly-recap';

describe('buildWeeklyRecap', () => {
  it('aggregates a week of plan days', () => {
    const recap = buildWeeklyRecap('2026-06-01', '2026-06-04', { 1: { day: 1, note: 'Great talk', dateISO: '2026-06-01' } }, 2);
    expect(recap.days.length).toBeGreaterThan(0);
    expect(recap.journalCount).toBe(1);
    expect(recap.answeredPrayerCount).toBe(2);
    expect(recap.themes.length).toBeGreaterThan(0);
  });
});

describe('isRecapDay', () => {
  it('is true on Sundays', () => {
    expect(isRecapDay('2026-06-07')).toBe(true);
  });

  it('is false on other days', () => {
    expect(isRecapDay('2026-06-08')).toBe(false);
  });
});
