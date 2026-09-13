import {
  effectiveStreak,
  isVacationActive,
  shouldPauseReminders,
  shouldSuppressCatchUp,
  validateVacationMode,
} from '@/lib/vacation-mode';

describe('isVacationActive', () => {
  it('is false when inactive', () => {
    expect(isVacationActive({ active: false }, '2026-06-15')).toBe(false);
  });

  it('respects date range', () => {
    const mode = { active: true, startDate: '2026-06-10', endDate: '2026-06-20' };
    expect(isVacationActive(mode, '2026-06-15')).toBe(true);
    expect(isVacationActive(mode, '2026-06-09')).toBe(false);
    expect(isVacationActive(mode, '2026-06-21')).toBe(false);
  });
});

describe('shouldSuppressCatchUp', () => {
  it('suppresses during vacation', () => {
    expect(shouldSuppressCatchUp({ active: true, startDate: '2026-06-01' }, '2026-06-15')).toBe(true);
  });
});

describe('shouldPauseReminders', () => {
  it('pauses during vacation', () => {
    expect(shouldPauseReminders({ active: true }, '2026-06-15')).toBe(true);
  });
});

describe('effectiveStreak', () => {
  const dates = ['2026-06-10', '2026-06-11', '2026-06-12'];

  it('returns normal streak when not on vacation', () => {
    expect(effectiveStreak(dates, '2026-06-12', { active: false })).toBe(3);
  });

  it('freezes streak during vacation', () => {
    const mode = { active: true, startDate: '2026-06-13' };
    expect(effectiveStreak(dates, '2026-06-15', mode)).toBe(3);
  });
});

describe('validateVacationMode', () => {
  it('rejects end before start', () => {
    expect(
      validateVacationMode({ active: true, startDate: '2026-06-20', endDate: '2026-06-10' })
    ).toBeTruthy();
  });
});
