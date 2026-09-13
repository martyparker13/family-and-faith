#!/usr/bin/env node
/**
 * Generates Spanish (es) versions of all content JSON files using the
 * Anthropic API. Outputs to content/es/.
 *
 * Prerequisites:
 *   npm install @anthropic-ai/sdk   (or: already in devDependencies)
 *   export ANTHROPIC_API_KEY=sk-...
 *
 * Run:
 *   node scripts/translate-to-spanish.js
 *
 * The script processes content in batches to stay within context limits and
 * writes output incrementally so you can stop and restart safely — already-
 * translated days are skipped (add --force to retranslate everything).
 */

const fs   = require('fs');
const path = require('path');

const ROOT    = path.join(__dirname, '..');
const EN_DIR  = path.join(ROOT, 'content');
const ES_DIR  = path.join(ROOT, 'content', 'es');
const FORCE   = process.argv.includes('--force');
const BATCH   = 10; // days per API call

// ── helpers ──────────────────────────────────────────────────────────────────

function loadJson(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return []; }
}

function saveJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

async function callClaude(prompt) {
  const Anthropic = require('@anthropic-ai/sdk');
  const client = new Anthropic();
  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 8192,
    messages: [{ role: 'user', content: prompt }],
  });
  const text = msg.content.find(b => b.type === 'text')?.text ?? '';
  // Strip markdown code fences if present
  return text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
}

// ── translation functions ─────────────────────────────────────────────────────

async function translateDevotionals() {
  const en = loadJson(path.join(EN_DIR, 'devotionals.json'));
  const esFile = path.join(ES_DIR, 'devotionals.json');
  const es = FORCE ? [] : loadJson(esFile);

  console.log(`\nDevotionals: ${en.length} total, ${es.length} already translated`);

  for (let i = es.length; i < en.length; i += BATCH) {
    const batch = en.slice(i, i + BATCH);
    console.log(`  Translating days ${batch[0].day}–${batch[batch.length - 1].day}…`);

    const prompt = `Translate these ${batch.length} family devotional entries from English to Spanish (Latin American, warm and accessible for families with young children). Return ONLY valid JSON — an array with the same structure as the input, same day numbers. Translate: title, theme, scripture.text, reflection, questions[].question, familyChallenge. Do NOT translate scripture.reference (keep as-is). Keep "______" blanks exactly as-is.

Input JSON:
${JSON.stringify(batch, null, 2)}

Return only the JSON array, no explanation.`;

    const raw = await callClaude(prompt);
    let translated;
    try {
      translated = JSON.parse(raw);
    } catch (err) {
      console.error(`  ✗ JSON parse error for batch starting at day ${batch[0].day}:`, err.message);
      console.error('  Raw response (first 500 chars):', raw.slice(0, 500));
      continue;
    }

    for (const entry of translated) {
      es[entry.day - 1] = entry;
    }
    saveJson(esFile, es);
    console.log(`  ✓ Saved through day ${batch[batch.length - 1].day}`);
  }
  console.log('Devotionals complete.');
}

async function translatePrayers() {
  const en = loadJson(path.join(EN_DIR, 'prayers.json'));
  const esFile = path.join(ES_DIR, 'prayers.json');
  const es = FORCE ? [] : loadJson(esFile);

  console.log(`\nPrayers: ${en.length} total, ${es.length} already translated`);

  for (let i = es.length; i < en.length; i += BATCH) {
    const batch = en.slice(i, i + BATCH);
    console.log(`  Translating days ${batch[0].day}–${batch[batch.length - 1].day}…`);

    const prompt = `Translate these ${batch.length} family prayer entries from English to natural, warm Spanish (Latin American). Return ONLY valid JSON — same array structure, same day numbers. Translate: theme, title, lines[], togetherLine. Keep "______" placeholders exactly as-is.

Input JSON:
${JSON.stringify(batch, null, 2)}

Return only the JSON array, no explanation.`;

    const raw = await callClaude(prompt);
    let translated;
    try {
      translated = JSON.parse(raw);
    } catch (err) {
      console.error(`  ✗ JSON parse error for batch at day ${batch[0].day}:`, err.message);
      continue;
    }

    for (const entry of translated) {
      es[entry.day - 1] = entry;
    }
    saveJson(esFile, es);
    console.log(`  ✓ Saved through day ${batch[batch.length - 1].day}`);
  }
  console.log('Prayers complete.');
}

async function translateReadingPlan() {
  const en = loadJson(path.join(EN_DIR, 'reading-plan.json'));
  const esFile = path.join(ES_DIR, 'reading-plan.json');
  const es = FORCE ? [] : loadJson(esFile);

  console.log(`\nReading plan summaries: ${en.length} total, ${es.length} already translated`);

  // Only kidSummary needs translation; passages are universal
  const toTranslate = en.slice(es.length).map(d => ({ day: d.day, kidSummary: d.kidSummary }));

  for (let i = 0; i < toTranslate.length; i += 25) {
    const batch = toTranslate.slice(i, i + 25);
    console.log(`  Translating days ${batch[0].day}–${batch[batch.length - 1].day}…`);

    const prompt = `Translate these kid-friendly one-sentence Bible reading summaries from English to Spanish (simple, warm, suitable for young children). Return ONLY valid JSON — same array structure with day and kidSummary fields.

Input JSON:
${JSON.stringify(batch, null, 2)}

Return only the JSON array, no explanation.`;

    const raw = await callClaude(prompt);
    let translated;
    try {
      translated = JSON.parse(raw);
    } catch (err) {
      console.error(`  ✗ JSON parse error at day ${batch[0].day}:`, err.message);
      continue;
    }

    for (const entry of translated) {
      // Merge: keep English passages, replace kidSummary
      const enDay = en[entry.day - 1];
      es[entry.day - 1] = { ...enDay, kidSummary: entry.kidSummary };
    }
    saveJson(esFile, es);
    console.log(`  ✓ Saved through day ${batch[batch.length - 1].day}`);
  }
  console.log('Reading plan complete.');
}

async function translateGuidanceTopics() {
  const en = loadJson(path.join(EN_DIR, 'guidance-topics.json'));
  const esFile = path.join(ES_DIR, 'guidance-topics.json');

  if (!FORCE && loadJson(esFile).length === en.length) {
    console.log('\nGuidance topics: already translated, skipping (use --force to redo)');
    return;
  }

  console.log(`\nGuidance topics: ${en.length} total`);

  const prompt = `Translate these Scripture guidance topics from English to Spanish (Latin American, warm and pastoral tone). Return ONLY valid JSON — same array structure. Translate: name, category, keywords[], note. Do NOT translate: id, verses[].reference, verses[].text.

Input JSON:
${JSON.stringify(en, null, 2)}

Return only the JSON array, no explanation.`;

  const raw = await callClaude(prompt);
  let translated;
  try {
    translated = JSON.parse(raw);
  } catch (err) {
    console.error('✗ JSON parse error for guidance topics:', err.message);
    return;
  }

  saveJson(esFile, translated);
  console.log(`✓ Guidance topics complete (${translated.length} topics)`);
}

// ── main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('Error: ANTHROPIC_API_KEY environment variable is not set.');
    console.error('  export ANTHROPIC_API_KEY=sk-ant-...');
    process.exit(1);
  }

  try { require('@anthropic-ai/sdk'); } catch {
    console.error('Error: @anthropic-ai/sdk is not installed.');
    console.error('  npm install @anthropic-ai/sdk');
    process.exit(1);
  }

  console.log('Family & Faith — Spanish content generator');
  console.log(`Output: ${ES_DIR}`);
  if (FORCE) console.log('Mode: --force (retranslating all entries)');

  await translateGuidanceTopics();
  await translateReadingPlan();
  await translatePrayers();
  await translateDevotionals();

  console.log('\nAll done! Run `eas build --platform ios` to include the new content.');
}

main().catch(err => { console.error(err); process.exit(1); });
