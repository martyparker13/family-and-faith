import { buildWeeklyRecap } from '@/lib/weekly-recap';
import { buildWeeklySheetHtml, buildWeeklySheetText } from '@/lib/weekly-sheet';

describe('weekly sheet', () => {
  const recap = buildWeeklyRecap('2026-01-05', '2026-01-11', {}, 0);

  it('builds HTML with week label', () => {
    const html = buildWeeklySheetHtml({ familyName: 'Parkers', recap });
    expect(html).toContain('Parkers');
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('Memory verse');
  });

  it('builds plain text with readings', () => {
    const text = buildWeeklySheetText({ familyName: 'Parkers', recap, sundayNote: 'God is good' });
    expect(text).toContain('Parkers');
    expect(text).toContain('Day 1');
    expect(text).toContain('From church');
    expect(text).toContain('God is good');
  });
});
