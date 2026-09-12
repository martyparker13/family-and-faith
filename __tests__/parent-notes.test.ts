import {
  activeParentNoteBands,
  noteForBand,
  parentNotePreview,
  parentNotesForDisplay,
} from '@/lib/parent-notes';
import type { ParentNotes } from '@/lib/content';

const sampleNotes: ParentNotes = {
  trigger: 'Violence',
  little: 'Keep it simple for little ones. Focus on kindness.',
  older: 'Name the violence honestly and discuss consequences.',
  teen: 'Engage ethical nuance with teens ready for harder questions.',
};

describe('activeParentNoteBands', () => {
  it('defaults to little and older when no children configured', () => {
    expect(activeParentNoteBands([])).toEqual(new Set(['little', 'older']));
  });

  it('includes teen when a teen is configured', () => {
    expect(activeParentNoteBands([{ ageBand: 'teen' }])).toEqual(new Set(['teen']));
  });
});

describe('noteForBand', () => {
  it('falls back to older for teen when teen note is absent', () => {
    const notes: ParentNotes = {
      trigger: 'Death',
      little: 'Little note.',
      older: 'Older note.',
    };
    expect(noteForBand(notes, 'teen')).toBe('Older note.');
  });

  it('uses teen note when provided', () => {
    expect(noteForBand(sampleNotes, 'teen')).toBe(sampleNotes.teen);
  });
});

describe('parentNotesForDisplay', () => {
  it('shows only little notes for a young family', () => {
    const displays = parentNotesForDisplay(sampleNotes, [{ ageBand: 'little' }], false);
    expect(displays).toHaveLength(1);
    expect(displays[0].band).toBe('little');
  });

  it('shows all bands when requested', () => {
    const displays = parentNotesForDisplay(
      sampleNotes,
      [{ ageBand: 'little' }],
      true
    );
    expect(displays.map((d) => d.band)).toEqual(['little', 'older', 'teen']);
  });
});

describe('parentNotePreview', () => {
  it('returns trigger and first sentence of the little note', () => {
    expect(parentNotePreview(sampleNotes)).toEqual({
      trigger: 'Violence',
      preview: 'Keep it simple for little ones.',
    });
  });
});
