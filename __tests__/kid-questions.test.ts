import { validateKidQuestion } from '@/store/kid-questions';

describe('validateKidQuestion', () => {
  it('rejects empty questions', () => {
    expect(validateKidQuestion('')).toBeTruthy();
    expect(validateKidQuestion('   ')).toBeTruthy();
  });

  it('accepts valid questions', () => {
    expect(validateKidQuestion('Why did Cain hurt Abel?')).toBeNull();
  });

  it('rejects overly long questions', () => {
    expect(validateKidQuestion('x'.repeat(501))).toBeTruthy();
  });
});
