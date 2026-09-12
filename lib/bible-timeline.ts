/**
 * OT narrative timeline position — days 1–365 mapped through the OT story track.
 */
import { readingPlan } from '@/lib/content';

/** Percent (0–100) through the OT story track for a plan day. */
export function otTimelinePercent(day: number): number {
  const clamped = Math.min(365, Math.max(1, Math.round(day)));
  return Math.round((clamped / 365) * 100);
}

export interface TimelineInfo {
  percent: number;
  otReference: string;
  label: string;
}

/** Human-readable "where we are" for the OT story arc. */
export function timelineInfo(day: number): TimelineInfo {
  const planDay = readingPlan[Math.min(365, Math.max(1, day)) - 1];
  const otPassage = planDay.passages.find((p) => p.track === 'ot');
  const ref = otPassage?.reference ?? planDay.passages[0]?.reference ?? '';
  const percent = otTimelinePercent(day);

  let label = 'Beginning the story';
  if (percent >= 90) label = 'Nearing the end of the Old Testament';
  else if (percent >= 70) label = 'Prophets and exile';
  else if (percent >= 50) label = 'Kings and kingdoms';
  else if (percent >= 25) label = 'Wilderness and the law';
  else if (percent >= 10) label = 'Patriarchs and Egypt';

  return { percent, otReference: ref, label };
}
