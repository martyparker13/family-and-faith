/**
 * Share weekly recap with grandparents / extended family.
 */
import { t } from '@/i18n/index';
import type { WeeklyRecap } from '@/lib/weekly-recap';
import type { PrayerRequest } from '@/store/prayer-list';

export interface ShareRecapInput {
  familyName: string;
  recap: WeeklyRecap;
  sundayNote?: string;
  answeredPrayers?: PrayerRequest[];
}

/** Formatted message for Share API. */
export function buildShareRecapMessage(input: ShareRecapInput): string {
  const { familyName, recap, sundayNote, answeredPrayers = [] } = input;
  const name = familyName || t('common.ourFamily');

  const lines: string[] = [
    t('recap.weekInWord', { name, week: recap.weekLabel }),
    '',
    t('recap.thisWeekWeRead'),
  ];

  for (const d of recap.days) {
    lines.push(t('recap.dayEntry', { day: d.day, references: d.references, theme: d.theme }));
  }

  lines.push('', t('common.recapThemes', { themes: recap.themes.join(', ') }));

  if (recap.journalCount > 0) {
    lines.push(t('recap.journalEntriesWeek', { count: recap.journalCount }));
  }

  const answered = answeredPrayers.filter((r) => r.answeredAt);
  if (answered.length > 0) {
    lines.push('', t('recap.answeredPrayersHeader'));
    for (const r of answered.slice(0, 5)) {
      lines.push(
        t('recap.answeredEntry', {
          title: r.title,
          note: r.answeredNote ? ` — ${r.answeredNote}` : '',
        })
      );
    }
  }

  if (sundayNote) {
    lines.push('', t('recap.fromChurchWeek'), sundayNote);
  }

  lines.push('', t('common.sentWithLove'));
  return lines.join('\n');
}
