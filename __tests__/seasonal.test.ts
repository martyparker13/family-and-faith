import { activeSeasonalOverlay, isDateInRange, seasonalWeek } from '@/lib/seasonal';

describe('isDateInRange', () => {
  it('handles non-wrapping ranges', () => {
    expect(isDateInRange('12-01', '11-27', '12-24')).toBe(true);
    expect(isDateInRange('11-01', '11-27', '12-24')).toBe(false);
  });
});

describe('activeSeasonalOverlay', () => {
  it('returns advent in December when enabled', () => {
    const overlay = activeSeasonalOverlay('2026-12-05', true);
    expect(overlay?.id).toBe('advent');
  });

  it('returns null when disabled', () => {
    expect(activeSeasonalOverlay('2026-12-05', false)).toBeNull();
  });
});

describe('seasonalWeek', () => {
  it('returns week 1 at advent start', () => {
    const overlay = activeSeasonalOverlay('2026-11-28', true);
    expect(overlay).not.toBeNull();
    if (overlay) {
      expect(seasonalWeek(overlay, '2026-11-28')).toBe(1);
    }
  });
});
