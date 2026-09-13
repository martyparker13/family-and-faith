#!/usr/bin/env node
/**
 * Resumes Spanish devotional translation from where translate-to-spanish.js left off.
 * Uses batch size of 3 to stay well under output token limits.
 * Safe to stop and restart — skips days that already have a translation.
 *
 * Run:
 *   ANTHROPIC_API_KEY=sk-... node scripts/translate-devotionals-es.js
 */

const fs   = require('fs');
const path = require('path');

const ROOT   = path.join(__dirname, '..');
const EN     = require(path.join(ROOT, 'content', 'devotionals.json'));
const ES_FILE = path.join(ROOT, 'content', 'es', 'devotionals.json');
const BATCH  = 3;

function loadEs() {
  try { return JSON.parse(fs.readFileSync(ES_FILE, 'utf8')); } catch { return []; }
}

function saveEs(arr) {
  fs.writeFileSync(ES_FILE, JSON.stringify(arr, null, 2) + '\n', 'utf8');
}

async function translate(batch) {
  const Anthropic = require('@anthropic-ai/sdk');
  const client = new Anthropic();
  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 8000,
    messages: [{
      role: 'user',
      content: `Translate these ${batch.length} family devotional entries from English to Spanish (Latin American, warm and accessible for families with young children).

Return ONLY a valid JSON array with the same structure. Translate these fields:
- title
- theme
- scripture.text  (do NOT change scripture.reference)
- reflection (keep paragraph breaks as \\n\\n)
- questions[].question
- familyChallenge

Keep "______" blanks exactly as-is.

Input:
${JSON.stringify(batch, null, 2)}

Return only the JSON array, nothing else.`
    }],
  });

  const text = msg.content.find(b => b.type === 'text')?.text ?? '';
  const clean = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
  return JSON.parse(clean);
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('Set ANTHROPIC_API_KEY first.');
    process.exit(1);
  }

  const es = loadEs();
  // Expand array to 365 slots
  while (es.length < 365) es.push(null);

  // Find days that need translation
  const needed = EN.filter((_, i) => !es[i] || !es[i].title);
  console.log(`Devotionals: ${365 - needed.length} already done, ${needed.length} remaining`);

  for (let i = 0; i < needed.length; i += BATCH) {
    const batch = needed.slice(i, i + BATCH);
    const dayRange = `days ${batch[0].day}–${batch[batch.length - 1].day}`;
    process.stdout.write(`  Translating ${dayRange}… `);

    let attempts = 0;
    while (attempts < 3) {
      try {
        const translated = await translate(batch);
        for (const entry of translated) {
          es[entry.day - 1] = entry;
        }
        saveEs(es);
        console.log('✓');
        break;
      } catch (err) {
        attempts++;
        if (attempts >= 3) {
          console.log(`✗ failed after 3 attempts: ${err.message}`);
        } else {
          process.stdout.write(`retrying… `);
          await new Promise(r => setTimeout(r, 2000));
        }
      }
    }
  }

  const done = es.filter(e => e && e.title).length;
  console.log(`\nDone. ${done}/365 devotionals translated.`);
}

main().catch(err => { console.error(err); process.exit(1); });
