#!/usr/bin/env node
/**
 * Regenerates all 365 family prayers with genuinely unique content — no
 * repeated titles and no recycled lines. Each batch sees every title already
 * used plus the previous batch's opening lines, so the writing stays fresh.
 *
 * Resumable: progress saves to content/prayers-v2.json after every batch;
 * rerunning skips finished days. When all 365 are done it backs up the old
 * file, swaps the new one in, and clears the stale Spanish prayers (the app
 * falls back to English until you re-run the translation script).
 *
 * Run:
 *   ANTHROPIC_API_KEY=sk-... node scripts/regenerate-prayers.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT_FILE = path.join(ROOT, 'content', 'prayers-v2.json');
const LIVE_FILE = path.join(ROOT, 'content', 'prayers.json');
const BACKUP_FILE = path.join(ROOT, 'content', 'prayers-v1-backup.json');
const ES_FILE = path.join(ROOT, 'content', 'es', 'prayers.json');
const BATCH = 5;
const MODEL = 'claude-sonnet-5';

const THEME_POOL = [
  'Gratitude', 'Courage', 'Kindness', 'Forgiveness', 'Peace', 'Patience',
  'School and Learning', 'Friends', 'Our Home', 'People Who Are Hurting',
  'Our Church', 'Creation and Seasons', 'Bedtime Trust', 'Morning Joy',
  'Serving Others', 'Honesty', 'Family Love', 'God\'s Protection',
  'Missionaries and the World', 'Hard Days', 'Celebration', 'New Beginnings',
  'Contentment', 'Generosity', 'Wisdom', 'Healing', 'Neighbors', 'Travel',
];

function loadOut() {
  try { return JSON.parse(fs.readFileSync(OUT_FILE, 'utf8')); } catch { return []; }
}

function saveOut(arr) {
  fs.writeFileSync(OUT_FILE, JSON.stringify(arr, null, 2) + '\n', 'utf8');
}

async function generateBatch(client, days, themes, usedTitles, recentOpeners) {
  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 6000,
    messages: [{
      role: 'user',
      content: `Write ${days.length} completely distinct family prayers for a Christian family app (read aloud by parents and kids ~4–12 together). Assign them day numbers ${days.join(', ')}.

Themes for this batch (one each, in order): ${themes.join('; ')}.

STRICT uniqueness rules:
- Do NOT use any of these titles (already used): ${usedTitles.length ? usedTitles.join('; ') : '(none yet)'}
- Do NOT open with any of these first lines (recently used): ${recentOpeners.length ? recentOpeners.join(' | ') : '(none yet)'}
- Every prayer must be written from scratch: fresh imagery, varied sentence rhythms, different openings (not always "Dear God" — also "Father...", "Lord Jesus...", "God of...", a thankful exclamation, a quiet confession...). Never reuse a line between prayers.

Format each as JSON with exactly this shape:
{
  "day": <number>,
  "theme": "<one-or-two-word theme>",
  "title": "<3-6 word title, no generic 'A ___ Prayer' pattern more than once per batch>",
  "lines": [<exactly 7 short lines a child can echo, warm and concrete; include exactly one line containing "______" where each family member fills in their own word>],
  "togetherLine": "<one short closing line the whole family says together, ending with Amen>"
}

Return ONLY a valid JSON array of ${days.length} prayers, nothing else.`,
    }],
  });

  const text = msg.content.find((b) => b.type === 'text')?.text ?? '';
  const clean = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
  return JSON.parse(clean);
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('Set ANTHROPIC_API_KEY first.');
    process.exit(1);
  }
  const Anthropic = require('@anthropic-ai/sdk');
  const client = new Anthropic();

  const out = loadOut();
  while (out.length < 365) out.push(null);

  const neededDays = [];
  for (let d = 1; d <= 365; d++) {
    if (!out[d - 1] || !out[d - 1].title) neededDays.push(d);
  }
  console.log(`Prayers: ${365 - neededDays.length} done, ${neededDays.length} remaining`);

  for (let i = 0; i < neededDays.length; i += BATCH) {
    const days = neededDays.slice(i, i + BATCH);
    const generated = out.filter(Boolean);
    const usedTitles = generated.map((e) => e.title);
    const recentOpeners = generated.slice(-15).map((e) => e.lines[0]);
    const themes = days.map((d, j) => THEME_POOL[(d + j * 5) % THEME_POOL.length]);

    process.stdout.write(`  Days ${days[0]}–${days[days.length - 1]}… `);
    let attempts = 0;
    while (attempts < 3) {
      try {
        const batch = await generateBatch(client, days, themes, usedTitles, recentOpeners);
        for (const entry of batch) {
          if (entry.day >= 1 && entry.day <= 365) out[entry.day - 1] = entry;
        }
        saveOut(out);
        console.log('✓');
        break;
      } catch (err) {
        attempts++;
        if (attempts >= 3) console.log(`✗ ${err.message}`);
        else {
          process.stdout.write('retrying… ');
          await new Promise((r) => setTimeout(r, 3000));
        }
      }
    }
  }

  const done = out.filter((e) => e && e.title).length;
  console.log(`\n${done}/365 prayers generated.`);

  if (done === 365) {
    fs.copyFileSync(LIVE_FILE, BACKUP_FILE);
    fs.copyFileSync(OUT_FILE, LIVE_FILE);
    fs.writeFileSync(ES_FILE, '[]\n', 'utf8');
    console.log('Swapped into content/prayers.json (old file backed up).');
    console.log('Spanish prayers cleared — re-run the translation script when ready.');
  } else {
    console.log('Rerun this script to finish the remaining days.');
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
