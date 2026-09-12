/**
 * Assembles a ~5-minute evening fallback: teaching point, one question, short prayer.
 */
import { filterQuestions } from '@/lib/age-bands';
import { getDevotional, getPlanDay, getPrayer, type DevotionalQuestion } from '@/lib/content';
import type { ChildProfile } from '@/store/settings';

export const QUICK_EVENING_GENTLE_NOTE =
  'A shorter family moment — you can always come back for the full reading.';

export interface QuickEveningContent {
  teachingPoint: string;
  question: string;
  questionAudience: DevotionalQuestion['audience'];
  prayerLines: string[];
  togetherLine: string;
  gentleNote: string;
}

/** Pick the best single devotional question for the family's age bands. */
export function pickQuickEveningQuestion(
  questions: DevotionalQuestion[],
  children: ChildProfile[]
): DevotionalQuestion {
  const filtered = filterQuestions(questions, children, false);
  return filtered[0] ?? questions[0];
}

export function buildQuickEvening(day: number, children: ChildProfile[]): QuickEveningContent {
  const plan = getPlanDay(day);
  const devotional = getDevotional(day);
  const prayer = getPrayer(day);
  const question = pickQuickEveningQuestion(devotional.questions, children);

  return {
    teachingPoint: plan.teachingPoint ?? plan.kidSummary,
    question: question.question,
    questionAudience: question.audience,
    prayerLines: prayer.lines.slice(0, 3),
    togetherLine: prayer.togetherLine,
    gentleNote: QUICK_EVENING_GENTLE_NOTE,
  };
}
