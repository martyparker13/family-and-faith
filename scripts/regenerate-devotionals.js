#!/usr/bin/env node
/**
 * Regenerates all 365 devotionals with genuinely unique content — no repeated
 * scripture passages, titles, or recycled reflection text. Each batch is told
 * every scripture reference and title already used, so nothing repeats.
 *
 * Resumable: progress saves to content/devotionals-v2.json after every batch;
 * rerunning skips finished days. When all 365 are done it backs up the old
 * file, swaps the new one in, and clears the stale Spanish devotionals
 * (the app falls back to English until you re-run the translation script).
 *
 * Run:
 *   ANTHROPIC_API_KEY=sk-... node scripts/regenerate-devotionals.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT_FILE = path.join(ROOT, 'content', 'devotionals-v2.json');
const LIVE_FILE = path.join(ROOT, 'content', 'devotionals.json');
const BACKUP_FILE = path.join(ROOT, 'content', 'devotionals-v1-backup.json');
const ES_FILE = path.join(ROOT, 'content', 'es', 'devotionals.json');
const BATCH = 3;
const MODEL = 'claude-sonnet-5';

// Steers each batch toward different territory so themes stay varied.
const THEME_POOL = [
  'Gratitude', 'Courage', 'Kindness', 'Forgiveness', 'Honesty', 'Patience',
  'Generosity', 'Prayer', 'Trusting God', 'Obedience', 'Joy', 'Peace',
  'Humility', 'Friendship', 'Serving Others', 'God\'s Creation', 'God\'s Love',
  'Perseverance', 'Wisdom', 'Self-Control', 'Compassion', 'Contentment',
  'Hope', 'Faithfulness', 'Gentleness', 'Encouragement', 'Repentance',
  'Worship', 'God\'s Promises', 'Loving Your Enemies', 'Sharing Your Faith',
  'Rest and Sabbath', 'Handling Anger', 'Fear and Worry', 'Jealousy',
  'Telling the Truth', 'Family Love', 'Helping the Hurting', 'God\'s Protection',
  'New Beginnings',
];

function loadOut() {
  try { return JSON.parse(fs.readFileSync(OUT_FILE, 'utf8')); } catch { return []; }
}

function saveOut(arr) {
  fs.writeFileSync(OUT_FILE, JSON.stringify(arr, null, 2) + '\n', 'utf8');
}

async function generateBatch(client, days, themes, usedRefs, usedTitles) {
  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 8000,
    messages: [{
      role: 'user',
      content: `Write ${days.length} completely distinct family devotionals for a Christian family app (parents reading with kids ~4–12). Assign them day numbers ${days.join(', ')}.

Suggested themes to draw from for this batch (one each, in order): ${themes.join('; ')}.

STRICT uniqueness rules:
- Do NOT use any of these scripture references (already used): ${usedRefs.length ? usedRefs.join('; ') : '(none yet)'}
- Do NOT use any of these titles (already used): ${usedTitles.length ? usedTitles.join('; ') : '(none yet)'}
- Each devotional must anchor on a DIFFERENT Bible passage, have a fresh title, and a reflection written from scratch — no stock phrases, no template sentences reused between entries. Vary the openings (a story, a question, a surprising fact, a picture from nature...).

Format each as JSON with exactly this shape:
{
  "day": <number>,
  "title": "<3-6 word title>",
  "theme": "<one-or-two-word theme>",
  "scripture": { "reference": "<Book C:V or C:V-V>", "text": "<the verse text, World English Bible (WEB) translation>" },
  "reflection": "<three warm, concrete paragraphs separated by \\n\\n, ~60-90 words each, vivid and specific — real family situations, not abstractions>",
  "questions": [
    { "audience": "little", "question": "<simple question for ages 4-7>" },
    { "audience": "little", "question": "<simple question for ages 4-7>" },
    { "audience": "older", "question": "<deeper question for ages 8-12 and parents>" },
    { "audience": "older", "question": "<deeper question for ages 8-12 and parents>" }
  ],
  "familyChallenge": "<one concrete, doable activity for the family this week>"
}

Return ONLY a valid JSON array of ${days.length} devotionals, nothing else.`,
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
  console.log(`Devotionals: ${365 - neededDays.length} done, ${neededDays.length} remaining`);

  for (let i = 0; i < neededDays.length; i += BATCH) {
    const days = neededDays.slice(i, i + BATCH);
    const usedRefs = out.filter(Boolean).map((e) => e.scripture.reference);
    const usedTitles = out.filter(Boolean).map((e) => e.title);
    const themes = days.map((d, j) => THEME_POOL[(d + j * 7) % THEME_POOL.length]);

    process.stdout.write(`  Days ${days[0]}–${days[days.length - 1]}… `);
    let attempts = 0;
    while (attempts < 3) {
      try {
        const batch = await generateBatch(client, days, themes, usedRefs, usedTitles);
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
  console.log(`\n${done}/365 devotionals generated.`);

  if (done === 365) {
    fs.copyFileSync(LIVE_FILE, BACKUP_FILE);
    fs.copyFileSync(OUT_FILE, LIVE_FILE);
    fs.writeFileSync(ES_FILE, '[]\n', 'utf8');
    console.log('Swapped into content/devotionals.json (old file backed up).');
    console.log('Spanish devotionals cleared — re-run scripts/translate-devotionals-es.js when ready.');
  } else {
    console.log('Rerun this script to finish the remaining days.');
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
