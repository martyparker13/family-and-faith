import { slotStreak, slotCompletionDates } from '@/lib/streaks';

describe('slotStreak', () => {
  it('counts consecutive days for a slot', () => {
    const completions = {
      1: '2026-06-10',
      2: '2026-06-11',
      3: '2026-06-12',
    };
    expect(slotStreak(completions, '2026-06-12')).toBe(3);
  });

  it('allows streak ending yesterday', () => {
    expect(slotStreak({ 1: '2026-06-11' }, '2026-06-12')).toBe(1);
  });
});

describe('slotCompletionDates', () => {
  it('deduplicates dates', () => {
    expect(slotCompletionDates({ 1: '2026-06-10', 2: '2026-06-10' })).toEqual(['2026-06-10']);
  });
});
