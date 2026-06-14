import { allActivityDates, currentStreak, percentComplete } from '@/store/progress';
import { celebrationFor } from '@/lib/celebrate';

describe('currentStreak', () => {
  it('is 0 with no completions', () => {
    expect(currentStreak([], '2026-06-12')).toBe(0);
  });

  it('counts a streak ending today', () => {
    expect(currentStreak(['2026-06-10', '2026-06-11', '2026-06-12'], '2026-06-12')).toBe(3);
  });

  it("preserves a streak ending yesterday (today isn't done yet)", () => {
    expect(currentStreak(['2026-06-10', '2026-06-11'], '2026-06-12')).toBe(2);
  });

  it('resets after a missed day', () => {
    expect(currentStreak(['2026-06-08', '2026-06-09'], '2026-06-12')).toBe(0);
  });

  it('ignores gaps further back than the current run', () => {
    expect(
      currentStreak(['2026-06-01', '2026-06-11', '2026-06-12'], '2026-06-12')
    ).toBe(2);
  });

  it('deduplicates multiple completions on one date', () => {
    expect(currentStreak(['2026-06-12', '2026-06-12', '2026-06-11'], '2026-06-12')).toBe(2);
  });

  it('counts across a month boundary', () => {
    expect(currentStreak(['2026-05-31', '2026-06-01'], '2026-06-01')).toBe(2);
  });

  it('counts across a year boundary', () => {
    expect(currentStreak(['2026-12-31', '2027-01-01'], '2027-01-01')).toBe(2);
  });
});

describe('percentComplete', () => {
  it('is 0 with nothing completed', () => {
    expect(percentComplete({})).toBe(0);
  });

  it('is 100 with all 365 days', () => {
    const all: Record<number, string> = {};
    for (let d = 1; d <= 365; d++) all[d] = '2026-06-12';
    expect(percentComplete(all)).toBe(100);
  });

  it('rounds to whole percentages', () => {
    expect(percentComplete({ 1: 'x', 2: 'x', 3: 'x', 4: 'x' })).toBe(1); // 4/365 ≈ 1%
  });
});

describe('allActivityDates', () => {
  it('merges dates from all three activities', () => {
    const dates = allActivityDates({
      completedDays: { 1: '2026-06-10' },
      devotionalDays: { 1: '2026-06-11' },
      prayerDays: { 2: '2026-06-12' },
    });
    expect(dates.sort()).toEqual(['2026-06-10', '2026-06-11', '2026-06-12']);
  });
});

describe('celebrationFor', () => {
  const today = '2026-06-12';

  it('gives a small celebration for a single activity', () => {
    const result = celebrationFor(
      { completedDays: { 1: today }, devotionalDays: {}, prayerDays: {} },
      1,
      today
    );
    expect(result.size).toBe('small');
    expect(result.message).toBeNull();
  });

  it('gives a big celebration when all three are done for the day', () => {
    const state = {
      completedDays: { 1: today },
      devotionalDays: { 1: today },
      prayerDays: { 1: today },
    };
    const result = celebrationFor(state, 1, today);
    expect(result.size).toBe('big');
    expect(result.message).toContain('all done');
  });

  it('announces streak milestones', () => {
    // Seven consecutive days of readings ending today.
    const completedDays: Record<number, string> = {};
    for (let i = 0; i < 7; i++) {
      completedDays[i + 1] = `2026-06-${String(6 + i).padStart(2, '0')}`;
    }
    const result = celebrationFor({ completedDays, devotionalDays: {}, prayerDays: {} }, 7, today);
    expect(result.size).toBe('big');
    expect(result.message).toContain('week');
  });
});
