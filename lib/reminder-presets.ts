import type { ReminderTime } from '@/store/settings';

export type ReminderSlot = 'morning' | 'dinner' | 'bedtime';

/** Three sensible clock presets per rhythm slot (plus Custom + Off in the UI). */
export const SLOT_TIME_PRESETS: Record<ReminderSlot, readonly ReminderTime[]> = {
  morning: [
    { hour: 7, minute: 0 },
    { hour: 8, minute: 0 },
    { hour: 9, minute: 0 },
  ],
  dinner: [
    { hour: 17, minute: 0 },
    { hour: 18, minute: 0 },
    { hour: 19, minute: 0 },
  ],
  bedtime: [
    { hour: 19, minute: 30 },
    { hour: 20, minute: 0 },
    { hour: 20, minute: 30 },
  ],
};

/** True when both times match hour and minute. */
export function sameReminderTime(a: ReminderTime, b: ReminderTime): boolean {
  return a.hour === b.hour && a.minute === b.minute;
}

/**
 * Index of `time` within the slot's presets, or -1 when it is a custom time.
 * Pass `null` for Off — callers should treat Off separately from Custom.
 */
export function presetIndexForSlot(
  slot: ReminderSlot,
  time: ReminderTime | null
): number {
  if (!time) return -1;
  return SLOT_TIME_PRESETS[slot].findIndex((preset) => sameReminderTime(preset, time));
}

/** True when a non-null reminder does not match any preset for that slot. */
export function isCustomReminderTime(
  slot: ReminderSlot,
  time: ReminderTime | null
): boolean {
  return Boolean(time && presetIndexForSlot(slot, time) < 0);
}

/** Default clock when opening Custom from Off for a slot. */
export function defaultCustomTime(slot: ReminderSlot): ReminderTime {
  return SLOT_TIME_PRESETS[slot][0];
}
