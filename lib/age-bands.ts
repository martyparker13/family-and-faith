/**
 * Child age-band filtering for devotional questions.
 */
import { t } from '@/i18n/index';
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
  if (children.length === 0) return t('ageBands.hintDefault');
  const bands = [...new Set(children.map((c) => c.ageBand))];
  if (bands.length === 1 && bands[0] === 'little') {
    return t('ageBands.hintLittleOnly');
  }
  if (bands.every((b) => b === 'older' || b === 'teen')) {
    return t('ageBands.hintOlderOnly');
  }
  return t('ageBands.hintMixed');
}
