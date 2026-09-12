import {
  currentRhythmSlot,
  orderedSlots,
  slotActivity,
  rhythmDeepLink,
} from '@/lib/rhythm';

describe('currentRhythmSlot', () => {
  it('returns morning between 5 and 11', () => {
    expect(currentRhythmSlot(5)).toBe('morning');
    expect(currentRhythmSlot(11)).toBe('morning');
  });

  it('returns dinner between 12 and 19', () => {
    expect(currentRhythmSlot(12)).toBe('dinner');
    expect(currentRhythmSlot(19)).toBe('dinner');
  });

  it('returns bedtime at night and early morning', () => {
    expect(currentRhythmSlot(20)).toBe('bedtime');
    expect(currentRhythmSlot(4)).toBe('bedtime');
  });
});

describe('slotActivity', () => {
  it('maps slots to activities', () => {
    expect(slotActivity('morning')).toBe('reading');
    expect(slotActivity('dinner')).toBe('devotional');
    expect(slotActivity('bedtime')).toBe('prayer');
  });
});

describe('orderedSlots', () => {
  it('starts from the given slot', () => {
    expect(orderedSlots('dinner')).toEqual(['dinner', 'bedtime', 'morning']);
  });
});

describe('rhythmDeepLink', () => {
  it('builds faithandfamily scheme URLs', () => {
    expect(rhythmDeepLink('morning')).toBe('faithandfamily://rhythm/morning');
  });
});
