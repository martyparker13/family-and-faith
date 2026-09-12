import { catchUpStatus, effectivePlanDay, calendarDaysSinceStart, lastCompletedDay } from '@/lib/catch-up';

const emptyProgress = { completedDays: {}, devotionalDays: {}, prayerDays: {} };

describe('catchUpStatus', () => {
  it('does not offer catch-up when on track', () => {
    const progress = {
      completedDays: { 1: 'x', 2: 'x', 3: 'x', 4: 'x', 5: 'x' },
      devotionalDays: {},
      prayerDays: {},
    };
    const status = catchUpStatus('2026-06-01', '2026-06-05', progress, null);
    expect(status.planDay).toBe(5);
    expect(status.daysBehind).toBe(0);
    expect(status.shouldOfferCatchUp).toBe(false);
  });

  it('offers catch-up when far behind completions', () => {
    const progress = { completedDays: { 1: 'x', 2: 'x' }, devotionalDays: {}, prayerDays: {} };
    const status = catchUpStatus('2026-06-01', '2026-06-10', progress, null);
    expect(status.planDay).toBe(10);
    expect(status.daysBehind).toBe(8);
    expect(status.shouldOfferCatchUp).toBe(true);
  });

  it('respects today-only choice', () => {
    const progress = { completedDays: { 1: 'x' }, devotionalDays: {}, prayerDays: {} };
    const status = catchUpStatus('2026-06-01', '2026-06-10', progress, 'today-only');
    expect(status.shouldOfferCatchUp).toBe(false);
  });
});

describe('effectivePlanDay', () => {
  it('uses calendar day in today-only mode', () => {
    expect(effectivePlanDay('2026-06-01', '2026-06-10', 'today-only')).toBe(10);
  });
});

describe('calendarDaysSinceStart', () => {
  it('counts start day as day 1', () => {
    expect(calendarDaysSinceStart('2026-06-01', '2026-06-01')).toBe(1);
  });
});

describe('lastCompletedDay', () => {
  it('returns max across activities', () => {
    expect(
      lastCompletedDay({
        completedDays: { 3: 'x' },
        devotionalDays: { 5: 'x' },
        prayerDays: {},
      })
    ).toBe(5);
  });
});
