import {
  bookFromReference,
  completedBooks,
  lastPlanDayByBook,
  newlyCompletedBooks,
} from '@/lib/book-milestones';

describe('bookFromReference', () => {
  it('extracts book names', () => {
    expect(bookFromReference('Genesis 1–2')).toBe('Genesis');
    expect(bookFromReference('1 Samuel 3')).toBe('1 Samuel');
    expect(bookFromReference('Psalm 23')).toBe('Psalm');
  });
});

describe('lastPlanDayByBook', () => {
  it('includes Genesis with a positive day', () => {
    const map = lastPlanDayByBook();
    expect(map.Genesis).toBeGreaterThan(0);
  });
});

describe('newlyCompletedBooks', () => {
  it('returns books whose last day matches completion day', () => {
    const lastDay = lastPlanDayByBook();
    const genesisDay = lastDay.Genesis;
    const books = newlyCompletedBooks({ [genesisDay]: '2026-01-01' }, genesisDay);
    expect(books).toContain('Genesis');
  });

  it('returns empty when day not completed', () => {
    expect(newlyCompletedBooks({}, 50)).toEqual([]);
  });
});

describe('completedBooks', () => {
  it('lists books when their last day is done', () => {
    const lastDay = lastPlanDayByBook();
    const genesisDay = lastDay.Genesis;
    const books = completedBooks({ [genesisDay]: '2026-01-01' });
    expect(books).toContain('Genesis');
  });
});
