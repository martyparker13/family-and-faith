import { buildShareRecapMessage } from '@/lib/share-recap';
import { buildWeeklyRecap } from '@/lib/weekly-recap';

describe('buildShareRecapMessage', () => {
  it('formats a shareable recap message', () => {
    const recap = buildWeeklyRecap('2026-01-05', '2026-01-11', { 1: { day: 1, note: 'Great talk', dateISO: '2026-01-05' } }, 1);
    const message = buildShareRecapMessage({
      familyName: 'The Parkers',
      recap,
      sundayNote: 'Jesus loves us',
      answeredPrayers: [
        {
          id: '1',
          title: 'Grandma',
          note: '',
          createdAt: '2026-01-01',
          answeredAt: '2026-01-10',
          answeredNote: 'She is healing',
        },
      ],
    });
    expect(message).toContain('The Parkers');
    expect(message).toContain('Day 1');
    expect(message).toContain('Grandma');
    expect(message).toContain('Jesus loves us');
  });
});
