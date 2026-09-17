/**
 * Printable / shareable weekly family sheet.
 */
import { t } from '@/i18n/index';
import { getDevotional, getPlanDay, getPrayer } from '@/lib/content';
import { memoryVerseForDay } from '@/lib/memory-verse';
import type { WeeklyRecap } from '@/lib/weekly-recap';

export interface WeeklySheetInput {
  familyName: string;
  recap: WeeklyRecap;
  sundayNote?: string;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** HTML suitable for expo-print or browser print. */
export function buildWeeklySheetHtml(input: WeeklySheetInput): string {
  const { familyName, recap, sundayNote } = input;
  const memoryVerse = memoryVerseForDay(recap.startDay);
  const prayerTheme = getPrayer(recap.startDay).theme;

  const dayRows = recap.days
    .map((d) => {
      const plan = getPlanDay(d.day);
      const devotional = getDevotional(d.day);
      return `<tr>
        <td><strong>${t('recap.htmlDay')} ${d.day}</strong><br/><small>${escapeHtml(d.dateLabel)}</small></td>
        <td>${escapeHtml(plan.passages.map((p) => p.reference).join(' · '))}</td>
        <td>${escapeHtml(devotional.theme)}</td>
      </tr>`;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>${escapeHtml(t('recap.htmlTitle', { week: recap.weekLabel }))}</title>
  <style>
    body { font-family: Georgia, serif; color: #3d3428; padding: 24px; max-width: 720px; margin: 0 auto; }
    h1 { font-size: 22px; color: #8b6914; }
    h2 { font-size: 16px; color: #6b5a45; margin-top: 24px; }
    table { width: 100%; border-collapse: collapse; font-size: 14px; }
    td { border-bottom: 1px solid #e8dcc8; padding: 8px 4px; vertical-align: top; }
    .verse { font-style: italic; background: #faf6ef; padding: 12px; border-radius: 8px; }
    .meta { color: #7a6f5f; font-size: 13px; }
  </style>
</head>
<body>
  <h1>${escapeHtml(t('recap.weekSheetTitle', { name: familyName || t('common.ourFamily') }))}</h1>
  <p class="meta">${escapeHtml(recap.weekLabel)}</p>

  <h2>${escapeHtml(t('recap.htmlMemoryVerse'))}</h2>
  <div class="verse">"${escapeHtml(memoryVerse.text)}" — <em>${escapeHtml(memoryVerse.reference)}</em></div>

  <h2>${escapeHtml(t('recap.htmlPrayerTheme'))}</h2>
  <p>${escapeHtml(prayerTheme)}</p>

  <h2>${escapeHtml(t('recap.htmlDailyReadings'))}</h2>
  <table>
    <thead><tr><th>${escapeHtml(t('recap.htmlDay'))}</th><th>${escapeHtml(t('recap.htmlReadings'))}</th><th>${escapeHtml(t('recap.htmlTheme'))}</th></tr></thead>
    <tbody>${dayRows}</tbody>
  </table>

  ${
    sundayNote
      ? `<h2>${escapeHtml(t('recap.htmlFromChurch'))}</h2><p>${escapeHtml(sundayNote)}</p>`
      : ''
  }

  <p class="meta" style="margin-top:32px;">${escapeHtml(t('common.generatedBy'))}</p>
</body>
</html>`;
}

/** Plain-text version for Share API. */
export function buildWeeklySheetText(input: WeeklySheetInput): string {
  const { familyName, recap, sundayNote } = input;
  const memoryVerse = memoryVerseForDay(recap.startDay);
  const lines: string[] = [
    t('recap.weekSheetTitle', { name: familyName || t('common.ourFamily') }),
    recap.weekLabel,
    '',
    t('recap.memoryVerseHeader'),
    t('recap.memoryVerseLine', { text: memoryVerse.text, reference: memoryVerse.reference }),
    '',
    t('recap.thisWeekHeader'),
  ];

  for (const d of recap.days) {
    const plan = getPlanDay(d.day);
    lines.push(
      t('recap.dayPlanEntry', {
        day: d.day,
        date: d.dateLabel,
        references: plan.passages.map((p) => p.reference).join(' · '),
        theme: d.theme,
      })
    );
  }

  if (sundayNote) {
    lines.push('', t('recap.fromChurch'), sundayNote);
  }

  lines.push('', `— ${t('common.faithAndFamily')}`);
  return lines.join('\n');
}
