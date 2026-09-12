/**
 * Age-band selection for hard-passage parent notes.
 */
import type { ParentNotes } from '@/lib/content';
import type { AgeBand, ChildProfile } from '@/store/settings';

export type ParentNoteBand = AgeBand;

const BAND_LABELS: Record<ParentNoteBand, string> = {
  little: 'Ages 3–7',
  older: 'Ages 8–12',
  teen: 'Ages 13+',
};

/** Which age-band notes to show based on configured children. */
export function activeParentNoteBands(children: ChildProfile[]): Set<ParentNoteBand> {
  if (children.length === 0) {
    return new Set(['little', 'older']);
  }
  return new Set(children.map((c) => c.ageBand));
}

export function noteForBand(notes: ParentNotes, band: ParentNoteBand): string {
  if (band === 'teen') return notes.teen ?? notes.older;
  return notes[band];
}

export interface ParentNoteDisplay {
  band: ParentNoteBand;
  label: string;
  text: string;
}

/** Notes to render in ParentNoteBanner — filtered or all ages. */
export function parentNotesForDisplay(
  notes: ParentNotes,
  children: ChildProfile[],
  showAll: boolean
): ParentNoteDisplay[] {
  const active = activeParentNoteBands(children);
  const bands: ParentNoteBand[] = showAll
    ? (['little', 'older', ...(notes.teen ? (['teen'] as const) : [])] as ParentNoteBand[])
    : [...active];

  const ordered: ParentNoteBand[] = ['little', 'older', 'teen'];
  return ordered
    .filter((band) => bands.includes(band))
    .map((band) => ({
      band,
      label: BAND_LABELS[band],
      text: noteForBand(notes, band),
    }));
}

/** One-line preview for parent prep and Today card badge context. */
export function parentNotePreview(notes: ParentNotes): { trigger: string; preview: string } {
  const firstSentence = notes.little.split(/(?<=[.!?])\s+/)[0] ?? notes.little;
  return { trigger: notes.trigger, preview: firstSentence };
}
