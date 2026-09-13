#!/usr/bin/env node
/**
 * One-shot Spanish translation for ALL app content that needs it:
 *   1. Devotionals   (content/es/devotionals.json)     — batch of 3
 *   2. Prayers       (content/es/prayers.json)         — batch of 6
 *   3. Guidance      (content/es/guidance-topics.json) — batch of 8
 *
 * Fully resumable — progress saves after every batch, rerunning skips
 * anything already translated. Reading plan is skipped if already done.
 *
 * Run:
 *   ANTHROPIC_API_KEY=sk-... node scripts/translate-es.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const EN_DIR = path.join(ROOT, 'content');
const ES_DIR = path.join(ROOT, 'content', 'es');
const MODEL = 'claude-haiku-4-5-20251001';

const load = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const loadOr = (f, fallback) => { try { return load(f); } catch { return fallback; } };
const save = (f, data) => fs.writeFileSync(f, JSON.stringify(data, null, 2) + '\n', 'utf8');

let client;

async function callModel(prompt, maxTokens) {
  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
  });
  const text = msg.content.find((b) => b.type === 'text')?.text ?? '';
  const clean = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
  const parsed = JSON.parse(clean);
  // A singleton batch sometimes comes back as a bare object.
  return Array.isArray(parsed) ? parsed : [parsed];
}

/** Generic resumable batch loop over a 365-slot day-keyed array. */
async function translateDayKeyed({ label, enFile, esFile, batchSize, maxTokens, buildPrompt }) {
  const en = load(enFile);
  const es = loadOr(esFile, []);
  while (es.length < en.length) es.push(null);

  const needed = en.filter((_, i) => !es[i] || !es[i].title);
  console.log(`\n${label}: ${en.length - needed.length} done, ${needed.length} remaining`);

  const runBatch = async (batch) => {
    const translated = await callModel(buildPrompt(batch), maxTokens);
    for (const entry of translated) {
      if (entry.day >= 1 && entry.day <= en.length) es[entry.day - 1] = entry;
    }
    save(esFile, es);
  };

  for (let i = 0; i < needed.length; i += batchSize) {
    const batch = needed.slice(i, i + batchSize);
    process.stdout.write(`  days ${batch[0].day}–${batch[batch.length - 1].day}… `);

    let attempts = 0;
    let batchOk = false;
    while (attempts < 3) {
      try {
        await runBatch(batch);
        console.log('✓');
        batchOk = true;
        break;
      } catch (err) {
        attempts++;
        if (attempts < 3) {
          process.stdout.write('retrying… ');
          await new Promise((r) => setTimeout(r, 3000));
        }
      }
    }

    // Stubborn batch: translate its entries one at a time.
    if (!batchOk && batch.length > 1) {
      process.stdout.write('falling back to one-at-a-time: ');
      for (const entry of batch) {
        let singleOk = false;
        for (let a = 0; a < 3 && !singleOk; a++) {
          try {
            await runBatch([entry]);
            process.stdout.write(`${entry.day}✓ `);
            singleOk = true;
          } catch {
            await new Promise((r) => setTimeout(r, 3000));
          }
        }
        if (!singleOk) process.stdout.write(`${entry.day}✗ `);
      }
      console.log('');
    } else if (!batchOk) {
      console.log(`✗ day ${batch[0].day} failed — rerun to retry`);
    }
  }
  const done = es.filter((e) => e && e.title).length;
  console.log(`${label}: ${done}/${en.length} translated.`);
  return done === en.length;
}

async function translateGuidance() {
  const en = load(path.join(EN_DIR, 'guidance-topics.json'));
  const esFile = path.join(ES_DIR, 'guidance-topics.json');
  const es = loadOr(esFile, []);
  const doneIds = new Set(es.map((t) => t.id));

  const needed = en.filter((t) => !doneIds.has(t.id));
  console.log(`\nGuidance topics: ${en.length - needed.length} done, ${needed.length} remaining`);

  // Send only the translatable fields — echoing the long verse arrays back
  // through the model is what kept producing broken JSON.
  const versesById = new Map(en.map((t) => [t.id, t.verses]));
  const stripped = (t) => ({
    id: t.id,
    name: t.name,
    category: t.category,
    keywords: t.keywords,
    note: t.note,
  });

  const runBatch = async (batch) => {
    const translated = await callModel(
      `Translate these Scripture guidance topics from English to Spanish (Latin American, warm and pastoral tone).

Translate: name, category, keywords[] (natural Spanish search phrases people would actually type), note.
Do NOT change: id.

Input:
${JSON.stringify(batch.map(stripped), null, 2)}

Return ONLY the valid JSON array with the same structure, nothing else.`,
      6000
    );
    for (const topic of translated) {
      if (versesById.has(topic.id) && !es.some((t) => t.id === topic.id)) {
        es.push({ ...topic, verses: versesById.get(topic.id) });
      }
    }
    save(esFile, es);
  };

  const BATCH = 8;
  for (let i = 0; i < needed.length; i += BATCH) {
    const batch = needed.slice(i, i + BATCH);
    process.stdout.write(`  topics ${i + 1}–${i + batch.length} of ${needed.length}… `);

    let attempts = 0;
    let batchOk = false;
    while (attempts < 3) {
      try {
        await runBatch(batch);
        console.log('✓');
        batchOk = true;
        break;
      } catch (err) {
        attempts++;
        if (attempts < 3) {
          process.stdout.write('retrying… ');
          await new Promise((r) => setTimeout(r, 3000));
        }
      }
    }

    if (!batchOk) {
      process.stdout.write('falling back to one-at-a-time: ');
      for (const topic of batch) {
        let singleOk = false;
        for (let a = 0; a < 3 && !singleOk; a++) {
          try {
            await runBatch([topic]);
            process.stdout.write(`${topic.id}✓ `);
            singleOk = true;
          } catch {
            await new Promise((r) => setTimeout(r, 3000));
          }
        }
        if (!singleOk) process.stdout.write(`${topic.id}✗ `);
      }
      console.log('');
    }
  }
  console.log(`Guidance topics: ${es.length}/${en.length} translated.`);
  return es.length === en.length;
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('Set ANTHROPIC_API_KEY first.');
    process.exit(1);
  }
  const Anthropic = require('@anthropic-ai/sdk');
  client = new Anthropic();

  const devDone = await translateDayKeyed({
    label: 'Devotionals',
    enFile: path.join(EN_DIR, 'devotionals.json'),
    esFile: path.join(ES_DIR, 'devotionals.json'),
    batchSize: 3,
    maxTokens: 8000,
    buildPrompt: (batch) => `Translate these ${batch.length} family devotional entries from English to Spanish (Latin American, warm and accessible for families with young children).

Return ONLY a valid JSON array with the same structure. Translate these fields:
- title
- theme
- scripture.text  (do NOT change scripture.reference)
- reflection (keep paragraph breaks as \\n\\n)
- questions[].question (do NOT change questions[].audience)
- familyChallenge

Keep "______" blanks exactly as-is. Keep the "day" numbers unchanged.

Input:
${JSON.stringify(batch, null, 2)}

Return only the JSON array, nothing else.`,
  });

  const prayDone = await translateDayKeyed({
    label: 'Prayers',
    enFile: path.join(EN_DIR, 'prayers.json'),
    esFile: path.join(ES_DIR, 'prayers.json'),
    batchSize: 6,
    maxTokens: 8000,
    buildPrompt: (batch) => `Translate these ${batch.length} family prayers from English to Spanish (Latin American, warm, natural read-aloud rhythm for parents and children praying together).

Return ONLY a valid JSON array with the same structure. Translate: theme, title, lines[], togetherLine.
Keep "______" blanks exactly as-is. Keep the "day" numbers unchanged. End togetherLine with "Amén."

Input:
${JSON.stringify(batch, null, 2)}

Return only the JSON array, nothing else.`,
  });

  const guideDone = await translateGuidance();

  console.log('\n──────────');
  console.log(`Devotionals ${devDone ? '✓ complete' : '— rerun to finish'}`);
  console.log(`Prayers     ${prayDone ? '✓ complete' : '— rerun to finish'}`);
  console.log(`Guidance    ${guideDone ? '✓ complete' : '— rerun to finish'}`);
  if (devDone && prayDone && guideDone) {
    console.log('\nAll Spanish content ready — rebuild the app to bundle it.');
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
