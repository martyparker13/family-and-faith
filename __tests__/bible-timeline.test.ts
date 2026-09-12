import { otTimelinePercent, timelineInfo } from '@/lib/bible-timeline';

describe('otTimelinePercent', () => {
  it('is 0 at start and 100 at end', () => {
    expect(otTimelinePercent(1)).toBe(0);
    expect(otTimelinePercent(365)).toBe(100);
  });

  it('clamps out-of-range days', () => {
    expect(otTimelinePercent(0)).toBe(0);
    expect(otTimelinePercent(400)).toBe(100);
  });
});

describe('timelineInfo', () => {
  it('includes OT reference and label', () => {
    const info = timelineInfo(1);
    expect(info.percent).toBe(0);
    expect(info.otReference).toContain('Genesis');
    expect(info.label.length).toBeGreaterThan(5);
  });
});
