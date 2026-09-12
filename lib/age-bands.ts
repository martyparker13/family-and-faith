/**
 * Child age-band filtering for devotional questions.
 */
import type { DevotionalQuestion } from '@/lib/content';
import type { AgeBand, ChildProfile } from '@/store/settings';

/** Map teen band to older questions in content. */
export function audienceForBand(band: AgeBand): DevotionalQuestion['audience'] {
  return band === 'little' ? 'little' : 'older';
}

/** Which audiences to auto-expand based on configured children. */
export function activeAudiences(children: ChildProfile[]): Set<DevotionalQuestion['audience']> {
  if (children.length === 0) {
    return new Set(['little', 'older']);
  }
  const audiences = new Set<DevotionalQuestion['audience']>();
  for (const child of children) {
    audiences.add(audienceForBand(child.ageBand));
  }
  return audiences;
}

export function filterQuestions(
  questions: DevotionalQuestion[],
  children: ChildProfile[],
  showAll: boolean
): DevotionalQuestion[] {
  if (showAll) return questions;
  const audiences = activeAudiences(children);
  return questions.filter((q) => audiences.has(q.audience));
}

export function parentPrepQuestionHint(children: ChildProfile[]): string {
  if (children.length === 0) return 'Use the little-kid and older-kid questions.';
  const bands = [...new Set(children.map((c) => c.ageBand))];
  if (bands.length === 1 && bands[0] === 'little') {
    return 'Focus on the “For Little Ones” questions today.';
  }
  if (bands.every((b) => b === 'older' || b === 'teen')) {
    return 'Focus on the “For Older Kids & Parents” questions today.';
  }
  return 'Use one little-kid question and one older-kid question.';
}
