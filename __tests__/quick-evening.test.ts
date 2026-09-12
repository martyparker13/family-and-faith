import { buildQuickEvening, pickQuickEveningQuestion, QUICK_EVENING_GENTLE_NOTE } from '@/lib/quick-evening';
import { getDevotional } from '@/lib/content';

describe('pickQuickEveningQuestion', () => {
  const devotional = getDevotional(1);
  const questions = devotional.questions;

  it('prefers a little-kid question when only little children are configured', () => {
    const picked = pickQuickEveningQuestion(questions, [{ ageBand: 'little' }]);
    expect(picked.audience).toBe('little');
  });

  it('maps teen band to older questions in content', () => {
    const picked = pickQuickEveningQuestion(questions, [{ ageBand: 'teen' }]);
    expect(picked.audience).toBe('older');
  });
});

describe('buildQuickEvening', () => {
  it('assembles teaching point, one question, and short prayer', () => {
    const content = buildQuickEvening(1, [{ ageBand: 'little' }]);
    expect(content.teachingPoint.length).toBeGreaterThan(10);
    expect(content.question.length).toBeGreaterThan(5);
    expect(content.prayerLines.length).toBeGreaterThanOrEqual(1);
    expect(content.prayerLines.length).toBeLessThanOrEqual(3);
    expect(content.togetherLine.length).toBeGreaterThan(5);
    expect(content.gentleNote).toBe(QUICK_EVENING_GENTLE_NOTE);
  });

  it('does not mark reading — content has no reading completion fields', () => {
    const content = buildQuickEvening(50, []);
    expect(content).not.toHaveProperty('reading');
    expect(content.gentleNote).toContain('full reading');
  });
});
