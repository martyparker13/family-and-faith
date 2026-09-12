import { activeAudiences, filterQuestions } from '@/lib/age-bands';

describe('activeAudiences', () => {
  it('defaults to both when no children configured', () => {
    expect(activeAudiences([])).toEqual(new Set(['little', 'older']));
  });

  it('matches configured age bands', () => {
    expect(activeAudiences([{ ageBand: 'little' }, { ageBand: 'teen' }])).toEqual(
      new Set(['little', 'older'])
    );
  });
});

describe('filterQuestions', () => {
  const questions = [
    { audience: 'little' as const, question: 'Q1' },
    { audience: 'little' as const, question: 'Q2' },
    { audience: 'older' as const, question: 'Q3' },
    { audience: 'older' as const, question: 'Q4' },
  ];

  it('filters to little only', () => {
    const filtered = filterQuestions(questions, [{ ageBand: 'little' }], false);
    expect(filtered).toHaveLength(2);
  });

  it('shows all when requested', () => {
    expect(filterQuestions(questions, [{ ageBand: 'little' }], true)).toHaveLength(4);
  });
});
