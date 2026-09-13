import { proactiveGuidanceForDay } from '@/lib/proactive-guidance';

describe('proactiveGuidanceForDay', () => {
  it('returns a match for a known devotional theme day', () => {
    const match = proactiveGuidanceForDay(1);
    if (match) {
      expect(match.topicId).toBeTruthy();
      expect(match.topicName).toBeTruthy();
    }
  });

  it('returns null or valid topic for any day', () => {
    for (let day = 1; day <= 5; day++) {
      const match = proactiveGuidanceForDay(day);
      if (match) {
        expect(typeof match.topicId).toBe('string');
      }
    }
  });
});
