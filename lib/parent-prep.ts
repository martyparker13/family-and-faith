/**
 * Parent prep card content for Today screen.
 */
import { getDevotional, getPlanDay } from '@/lib/content';
import { parentPrepQuestionHint } from '@/lib/age-bands';
import type { ChildProfile } from '@/store/settings';

export interface ParentPrep {
  bigIdea: string;
  leadIn: string;
  questionHint: string;
  teachingPoint: string;
}

export function buildParentPrep(day: number, children: ChildProfile[]): ParentPrep {
  const plan = getPlanDay(day);
  const devotional = getDevotional(day);
  const teachingPoint = plan.teachingPoint ?? plan.kidSummary;

  return {
    bigIdea: `${devotional.theme}: ${devotional.title}`,
    teachingPoint,
    leadIn: `Tonight at the table, try: "We read about ${plan.passages[0]?.reference ?? 'Scripture'} today — ${teachingPoint}" Then open one question together.`,
    questionHint: parentPrepQuestionHint(children),
  };
}
