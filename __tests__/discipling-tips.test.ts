import { DISCIPLING_TIPS, disciplingTipForPlanDay } from '@/lib/discipling-tips';

describe('disciplingTipForPlanDay', () => {
  it('returns tips for days 1–14', () => {
    expect(disciplingTipForPlanDay(1)?.id).toBe('tip-1');
    expect(disciplingTipForPlanDay(14)?.id).toBe('tip-14');
  });

  it('returns null after day 14', () => {
    expect(disciplingTipForPlanDay(15)).toBeNull();
    expect(disciplingTipForPlanDay(0)).toBeNull();
  });

  it('has 14 unique tips', () => {
    expect(DISCIPLING_TIPS).toHaveLength(14);
    expect(new Set(DISCIPLING_TIPS.map((t) => t.id)).size).toBe(14);
  });
});
