import {
  defaultCustomTime,
  isCustomReminderTime,
  presetIndexForSlot,
  sameReminderTime,
  SLOT_TIME_PRESETS,
} from '@/lib/reminder-presets';

describe('SLOT_TIME_PRESETS', () => {
  it('gives each slot three presets in a sensible window', () => {
    expect(SLOT_TIME_PRESETS.morning).toHaveLength(3);
    expect(SLOT_TIME_PRESETS.dinner).toHaveLength(3);
    expect(SLOT_TIME_PRESETS.bedtime).toHaveLength(3);

    for (const time of SLOT_TIME_PRESETS.morning) {
      expect(time.hour).toBeGreaterThanOrEqual(5);
      expect(time.hour).toBeLessThan(12);
    }
    for (const time of SLOT_TIME_PRESETS.dinner) {
      expect(time.hour).toBeGreaterThanOrEqual(12);
      expect(time.hour).toBeLessThan(20);
    }
    for (const time of SLOT_TIME_PRESETS.bedtime) {
      expect(time.hour).toBeGreaterThanOrEqual(19);
    }
  });

  it('keeps morning free of PM times and bedtime free of AM times', () => {
    expect(SLOT_TIME_PRESETS.morning.every((t) => t.hour < 12)).toBe(true);
    expect(SLOT_TIME_PRESETS.bedtime.every((t) => t.hour >= 12)).toBe(true);
  });
});

describe('presetIndexForSlot / isCustomReminderTime', () => {
  it('finds matching presets', () => {
    expect(presetIndexForSlot('morning', { hour: 8, minute: 0 })).toBe(1);
    expect(presetIndexForSlot('dinner', { hour: 17, minute: 0 })).toBe(0);
    expect(presetIndexForSlot('bedtime', { hour: 20, minute: 30 })).toBe(2);
  });

  it('treats Off as not a preset index', () => {
    expect(presetIndexForSlot('morning', null)).toBe(-1);
    expect(isCustomReminderTime('morning', null)).toBe(false);
  });

  it('flags non-preset times as custom', () => {
    expect(isCustomReminderTime('morning', { hour: 12, minute: 0 })).toBe(true);
    expect(isCustomReminderTime('bedtime', { hour: 7, minute: 0 })).toBe(true);
    expect(isCustomReminderTime('dinner', { hour: 18, minute: 0 })).toBe(false);
  });
});

describe('sameReminderTime / defaultCustomTime', () => {
  it('compares hour and minute', () => {
    expect(sameReminderTime({ hour: 7, minute: 0 }, { hour: 7, minute: 0 })).toBe(true);
    expect(sameReminderTime({ hour: 7, minute: 0 }, { hour: 7, minute: 30 })).toBe(false);
  });

  it('defaults Custom to the first preset for the slot', () => {
    expect(defaultCustomTime('morning')).toEqual(SLOT_TIME_PRESETS.morning[0]);
    expect(defaultCustomTime('dinner')).toEqual(SLOT_TIME_PRESETS.dinner[0]);
    expect(defaultCustomTime('bedtime')).toEqual(SLOT_TIME_PRESETS.bedtime[0]);
  });
});
