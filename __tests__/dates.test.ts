import { currentPlanDay, dateForPlanDay, dateToISO, isoToDate } from '@/lib/dates';

describe('currentPlanDay', () => {
  it('is day 1 on the start date', () => {
    expect(currentPlanDay('2026-06-12', '2026-06-12')).toBe(1);
  });

  it('advances one day per calendar day', () => {
    expect(currentPlanDay('2026-06-12', '2026-06-13')).toBe(2);
    expect(currentPlanDay('2026-06-12', '2026-07-12')).toBe(31);
  });

  it('clamps to day 1 before the start date', () => {
    expect(currentPlanDay('2026-06-12', '2026-06-01')).toBe(1);
  });

  it('clamps to day 365 after the plan ends', () => {
    expect(currentPlanDay('2026-06-12', '2028-01-01')).toBe(365);
  });

  it('crosses a year boundary correctly', () => {
    // Dec 31 → Jan 1
    expect(currentPlanDay('2026-12-31', '2027-01-01')).toBe(2);
  });

  it('is stable across DST transitions', () => {
    // US DST starts Mar 8 2026 — the diff must still round to whole days.
    expect(currentPlanDay('2026-03-01', '2026-03-10')).toBe(10);
    // US DST ends Nov 1 2026.
    expect(currentPlanDay('2026-10-25', '2026-11-03')).toBe(10);
  });
});

describe('dateForPlanDay', () => {
  it('returns the start date for day 1', () => {
    expect(dateToISO(dateForPlanDay('2026-06-12', 1))).toBe('2026-06-12');
  });

  it('returns the right date for later days, across months', () => {
    expect(dateToISO(dateForPlanDay('2026-06-12', 20))).toBe('2026-07-01');
  });

  it('round-trips with currentPlanDay', () => {
    const start = '2026-01-15';
    for (const day of [1, 50, 200, 365]) {
      const date = dateToISO(dateForPlanDay(start, day));
      expect(currentPlanDay(start, date)).toBe(day);
    }
  });
});

describe('isoToDate / dateToISO', () => {
  it('round-trips a local date', () => {
    expect(dateToISO(isoToDate('2026-02-28'))).toBe('2026-02-28');
  });

  it('handles leap days', () => {
    expect(dateToISO(isoToDate('2028-02-29'))).toBe('2028-02-29');
  });
});
