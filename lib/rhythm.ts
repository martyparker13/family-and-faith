/**
 * Daily rhythm: morning reading, dinner devotional, bedtime prayer.
 * Slot detection is local-time based so families see what's "next".
 */
import { t } from '@/i18n/index';
import type { Activity } from '@/store/progress';

export type RhythmSlot = 'morning' | 'dinner' | 'bedtime';

const SLOT_ORDER: RhythmSlot[] = ['morning', 'dinner', 'bedtime'];

const SLOT_ICONS: Record<RhythmSlot, 'sunny' | 'restaurant' | 'moon'> = {
  morning: 'sunny',
  dinner: 'restaurant',
  bedtime: 'moon',
};

/** Maps each rhythm moment to its primary activity. */
export function slotActivity(slot: RhythmSlot): Activity {
  switch (slot) {
    case 'morning':
      return 'reading';
    case 'dinner':
      return 'devotional';
    case 'bedtime':
      return 'prayer';
  }
}

/** Which rhythm slot the current hour falls into (0–23). */
export function currentRhythmSlot(hour: number = new Date().getHours()): RhythmSlot {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 20) return 'dinner';
  return 'bedtime';
}

/** Slots ordered starting from the current one, then the rest of the day. */
export function orderedSlots(from: RhythmSlot = currentRhythmSlot()): RhythmSlot[] {
  const start = SLOT_ORDER.indexOf(from);
  return [...SLOT_ORDER.slice(start), ...SLOT_ORDER.slice(0, start)];
}

export interface SlotLabels {
  title: string;
  short: string;
  startLabel: string;
  doneLabel: string;
  icon: 'sunny' | 'restaurant' | 'moon';
}

/** Localized labels for a rhythm slot (uses active locale). */
export function getSlotLabels(slot: RhythmSlot): SlotLabels {
  return {
    title: t(`rhythm.${slot}.title`),
    short: t(`rhythm.${slot}.short`),
    startLabel: t(`rhythm.${slot}.startLabel`),
    doneLabel: t(`rhythm.${slot}.doneLabel`),
    icon: SLOT_ICONS[slot],
  };
}

/** @deprecated Use getSlotLabels(slot) for localized strings. */
export const SLOT_LABELS: Record<RhythmSlot, SlotLabels> = {
  morning: {
    title: 'Morning time',
    short: 'Morning',
    startLabel: 'Start morning time',
    doneLabel: 'Morning done',
    icon: 'sunny',
  },
  dinner: {
    title: 'Dinner talk',
    short: 'Dinner',
    startLabel: 'Start dinner talk',
    doneLabel: 'Dinner done',
    icon: 'restaurant',
  },
  bedtime: {
    title: 'Bedtime prayer',
    short: 'Bedtime',
    startLabel: 'Start bedtime prayer',
    doneLabel: 'Bedtime done',
    icon: 'moon',
  },
};

/** Deep-link path segment for a rhythm slot. */
export function rhythmDeepLink(slot: RhythmSlot): string {
  return `faithandfamily://rhythm/${slot}`;
}
