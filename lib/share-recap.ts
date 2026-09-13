/**
 * Share weekly recap with grandparents / extended family.
 */
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
  const name = familyName || 'Our family';

  const lines: string[] = [
    `${name} — our week in the Word (${recap.weekLabel})`,
    '',
    'This week we read:',
  ];

  for (const d of recap.days) {
    lines.push(`• Day ${d.day}: ${d.references} — ${d.theme}`);
  }

  lines.push('', `Themes: ${recap.themes.join(', ')}`);

  if (recap.journalCount > 0) {
    lines.push(`${recap.journalCount} journal entries this week.`);
  }

  const answered = answeredPrayers.filter((r) => r.answeredAt);
  if (answered.length > 0) {
    lines.push('', 'Answered prayers:');
    for (const r of answered.slice(0, 5)) {
      lines.push(`• ${r.title}${r.answeredNote ? ` — ${r.answeredNote}` : ''}`);
    }
  }

  if (sundayNote) {
    lines.push('', 'From church this week:', sundayNote);
  }

  lines.push('', 'Sent with love from Faith & Family 🌿');
  return lines.join('\n');
}
