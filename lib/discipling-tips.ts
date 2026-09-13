/**
 * First-time discipling tips — days 1–14 since plan start.
 */
import { t } from '@/i18n/index';

export interface DisciplingTip {
  id: string;
  day: number;
  title: string;
  body: string;
}

const TIP_IDS = Array.from({ length: 14 }, (_, i) => ({
  id: `tip-${i + 1}`,
  day: i + 1,
  key: `tip${i + 1}`,
}));

export function getDisciplingTips(): DisciplingTip[] {
  return TIP_IDS.map(({ id, day, key }) => ({
    id,
    day,
    title: t(`disciplingTips.${key}.title`),
    body: t(`disciplingTips.${key}.body`),
  }));
}

/** @deprecated Use getDisciplingTips() for locale-aware tips. */
export const DISCIPLING_TIPS: DisciplingTip[] = getDisciplingTips();

/** Tip for calendar day since plan start (1–14), or null after day 14. */
export function disciplingTipForPlanDay(planDaySinceStart: number): DisciplingTip | null {
  if (planDaySinceStart < 1 || planDaySinceStart > 14) return null;
  return getDisciplingTips().find((tip) => tip.day === planDaySinceStart) ?? null;
}
