/**
 * Content integrity: the bundled JSON the whole app depends on.
 * These run against the real generated files in content/.
 */
import devotionals from '@/content/devotionals.json';
import guidanceTopics from '@/content/guidance-topics.json';
import prayers from '@/content/prayers.json';
import readingPlan from '@/content/reading-plan.json';

describe('reading plan', () => {
  it('has 365 days, numbered sequentially', () => {
    expect(readingPlan).toHaveLength(365);
    readingPlan.forEach((d: { day: number }, i: number) => expect(d.day).toBe(i + 1));
  });

  it('covers all 1,189 Bible chapters exactly once', () => {
    const seen = new Map<string, number>();
    for (const day of readingPlan as { passages: { apiQueries: string[] }[] }[]) {
      for (const p of day.passages) {
        for (const q of p.apiQueries) seen.set(q, (seen.get(q) ?? 0) + 1);
      }
    }
    expect(seen.size).toBe(1189);
    expect([...seen.values()].every((n) => n === 1)).toBe(true);
  });

  it('gives every day a kid summary', () => {
    for (const day of readingPlan as { kidSummary: string }[]) {
      expect(day.kidSummary.length).toBeGreaterThan(20);
    }
  });
});

describe('devotionals', () => {
  it('has 365 entries with scripture, questions, and a challenge', () => {
    expect(devotionals).toHaveLength(365);
    for (const d of devotionals as {
      scripture: { text: string };
      questions: { audience: string }[];
      familyChallenge: string;
      reflection: string;
    }[]) {
      expect(d.scripture.text.length).toBeGreaterThan(10);
      expect(d.questions.filter((q) => q.audience === 'little').length).toBeGreaterThanOrEqual(2);
      expect(d.questions.filter((q) => q.audience === 'older').length).toBeGreaterThanOrEqual(2);
      expect(d.familyChallenge.length).toBeGreaterThan(10);
      const words = d.reflection.split(/\s+/).length;
      expect(words).toBeGreaterThanOrEqual(150);
      expect(words).toBeLessThanOrEqual(400);
    }
  });
});

describe('prayers', () => {
  it('has 365 entries, each with a fill-in-the-blank and together line', () => {
    expect(prayers).toHaveLength(365);
    for (const p of prayers as { lines: string[]; togetherLine: string }[]) {
      expect(p.lines.some((l) => l.includes('______'))).toBe(true);
      expect(p.togetherLine.length).toBeGreaterThan(5);
    }
  });
});

describe('guidance topics', () => {
  it('has 60+ topics across 16 categories with 4–8 verses each', () => {
    expect(guidanceTopics.length).toBeGreaterThanOrEqual(60);
    const categories = new Set(
      (guidanceTopics as { category: string }[]).map((t) => t.category)
    );
    expect(categories.size).toBe(16);
    for (const t of guidanceTopics as {
      id: string;
      keywords: string[];
      verses: { text: string }[];
    }[]) {
      expect(t.keywords.length).toBeGreaterThanOrEqual(6);
      expect(t.verses.length).toBeGreaterThanOrEqual(4);
      expect(t.verses.length).toBeLessThanOrEqual(8);
      for (const v of t.verses) expect(v.text.length).toBeGreaterThan(10);
    }
  });

  it('has unique topic ids', () => {
    const ids = (guidanceTopics as { id: string }[]).map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
