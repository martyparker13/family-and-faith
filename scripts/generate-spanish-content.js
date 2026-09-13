#!/usr/bin/env node
/**
 * Generates Spanish content JSON from English source files.
 * Uses MyMemory (short text) with Google Translate fallback and checkpoint resume.
 *
 * Usage: node scripts/generate-spanish-content.js [--resume]
 */
const fs = require('fs');
const path = require('path');
const { translate } = require('@vitalets/google-translate-api');

const CONTENT_DIR = path.join(__dirname, '..', 'content');
const CHECKPOINT_FILE = path.join(__dirname, '.spanish-content-checkpoint.json');
const SEP = '\n|||FF|||\n';
const MYMEMORY_DELAY = 350;
const GOOGLE_DELAY = 2500;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function translateMyMemory(text) {
  if (!text?.trim()) return text;
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|es`;
  const res = await fetch(url);
  const data = await res.json();
  await sleep(MYMEMORY_DELAY);
  if (data.responseStatus === 200 && data.responseData?.translatedText) {
    return data.responseData.translatedText;
  }
  throw new Error(data.responseDetails || 'MyMemory failed');
}

async function translateGoogle(text) {
  const result = await translate(text, { from: 'en', to: 'es' });
  await sleep(GOOGLE_DELAY);
  return result.text;
}

async function translateText(text) {
  if (!text?.trim()) return text;
  if (text.length <= 450) {
    try {
      return await translateMyMemory(text);
    } catch {
      // fall through
    }
  }
  try {
    return await translateGoogle(text);
  } catch (err) {
    console.warn('  keeping EN:', text.slice(0, 50), err.message);
    return text;
  }
}

async function translateBatch(texts) {
  const joined = texts.join(SEP);
  const translated = await translateText(joined);
  const parts = translated.split('|||FF|||').map((s) => s.trim());
  if (parts.length === texts.length) return parts;
  // Fallback: translate individually
  const out = [];
  for (const t of texts) out.push(await translateText(t));
  return out;
}

function loadCheckpoint() {
  if (!fs.existsSync(CHECKPOINT_FILE)) return {};
  return JSON.parse(fs.readFileSync(CHECKPOINT_FILE, 'utf8'));
}

function saveCheckpoint(cp) {
  fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(cp, null, 2));
}

async function generateGuidance(cp) {
  console.log('Translating guidance topics...');
  const en = JSON.parse(fs.readFileSync(path.join(CONTENT_DIR, 'guidance-topics.json'), 'utf8'));
  const start = cp.guidance ?? 0;
  const es = start > 0 && fs.existsSync(path.join(CONTENT_DIR, 'guidance-topics.es.json'))
    ? JSON.parse(fs.readFileSync(path.join(CONTENT_DIR, 'guidance-topics.es.json'), 'utf8'))
    : [];
  for (let i = start; i < en.length; i++) {
    const t = en[i];
    console.log(`  topic ${i + 1}/${en.length}: ${t.id}`);
    const [name, category, note] = await translateBatch([t.name, t.category, t.note]);
    const keywords = await translateBatch(t.keywords);
    const verses = [];
    for (const v of t.verses) {
      verses.push({ reference: v.reference, text: await translateText(v.text) });
    }
    es[i] = { id: t.id, name, category, keywords, note, verses };
    cp.guidance = i + 1;
    if (i % 5 === 0) {
      fs.writeFileSync(path.join(CONTENT_DIR, 'guidance-topics.es.json'), JSON.stringify(es, null, 1));
      saveCheckpoint(cp);
    }
  }
  fs.writeFileSync(path.join(CONTENT_DIR, 'guidance-topics.es.json'), JSON.stringify(es, null, 1));
  console.log('  wrote guidance-topics.es.json');
}

async function generateReadingPlanOverlay(cp) {
  console.log('Translating reading plan overlay...');
  const en = JSON.parse(fs.readFileSync(path.join(CONTENT_DIR, 'reading-plan.json'), 'utf8'));
  const start = cp.readingPlan ?? 0;
  const es = start > 0 && fs.existsSync(path.join(CONTENT_DIR, 'reading-plan.es.json'))
    ? JSON.parse(fs.readFileSync(path.join(CONTENT_DIR, 'reading-plan.es.json'), 'utf8'))
    : [];
  for (let i = start; i < en.length; i++) {
    const d = en[i];
    if (i % 25 === 0) console.log(`  day ${i + 1}/365`);
    const entry = { day: d.day, kidSummary: await translateText(d.kidSummary) };
    if (d.teachingPoint) entry.teachingPoint = await translateText(d.teachingPoint);
    if (d.bedtimeHighlight) entry.bedtimeHighlight = d.bedtimeHighlight;
    if (d.parentNotes) {
      const [trigger, little, older] = await translateBatch([
        d.parentNotes.trigger,
        d.parentNotes.little,
        d.parentNotes.older,
      ]);
      entry.parentNotes = { trigger, little, older };
      if (d.parentNotes.teen) entry.parentNotes.teen = await translateText(d.parentNotes.teen);
    }
    es[i] = entry;
    cp.readingPlan = i + 1;
    if (i % 25 === 0) {
      fs.writeFileSync(path.join(CONTENT_DIR, 'reading-plan.es.json'), JSON.stringify(es, null, 1));
      saveCheckpoint(cp);
    }
  }
  fs.writeFileSync(path.join(CONTENT_DIR, 'reading-plan.es.json'), JSON.stringify(es, null, 1));
  console.log('  wrote reading-plan.es.json');
}

async function generatePrayers(cp) {
  console.log('Translating prayers...');
  const en = JSON.parse(fs.readFileSync(path.join(CONTENT_DIR, 'prayers.json'), 'utf8'));
  const start = cp.prayers ?? 0;
  const es = start > 0 && fs.existsSync(path.join(CONTENT_DIR, 'prayers.es.json'))
    ? JSON.parse(fs.readFileSync(path.join(CONTENT_DIR, 'prayers.es.json'), 'utf8'))
    : [];
  for (let i = start; i < en.length; i++) {
    const p = en[i];
    if (i % 25 === 0) console.log(`  prayer ${i + 1}/365`);
    const [theme, title, togetherLine] = await translateBatch([p.theme, p.title, p.togetherLine]);
    const lines = await translateBatch(p.lines);
    es[i] = { day: p.day, theme, title, lines, togetherLine };
    cp.prayers = i + 1;
    if (i % 25 === 0) {
      fs.writeFileSync(path.join(CONTENT_DIR, 'prayers.es.json'), JSON.stringify(es, null, 1));
      saveCheckpoint(cp);
    }
  }
  fs.writeFileSync(path.join(CONTENT_DIR, 'prayers.es.json'), JSON.stringify(es, null, 1));
  console.log('  wrote prayers.es.json');
}

async function generateDevotionals(cp) {
  console.log('Translating devotionals...');
  const en = JSON.parse(fs.readFileSync(path.join(CONTENT_DIR, 'devotionals.json'), 'utf8'));
  const start = cp.devotionals ?? 0;
  const es = start > 0 && fs.existsSync(path.join(CONTENT_DIR, 'devotionals.es.json'))
    ? JSON.parse(fs.readFileSync(path.join(CONTENT_DIR, 'devotionals.es.json'), 'utf8'))
    : [];
  for (let i = start; i < en.length; i++) {
    const d = en[i];
    if (i % 10 === 0) console.log(`  devotional ${i + 1}/365`);
    const [title, theme, scriptureText, familyChallenge] = await translateBatch([
      d.title,
      d.theme,
      d.scripture.text,
      d.familyChallenge,
    ]);
    const reflection = await translateText(d.reflection);
    const questions = [];
    for (const q of d.questions) {
      questions.push({ audience: q.audience, question: await translateText(q.question) });
    }
    es[i] = {
      day: d.day,
      title,
      theme,
      scripture: { reference: d.scripture.reference, text: scriptureText },
      reflection,
      questions,
      familyChallenge,
    };
    cp.devotionals = i + 1;
    if (i % 10 === 0) {
      fs.writeFileSync(path.join(CONTENT_DIR, 'devotionals.es.json'), JSON.stringify(es, null, 1));
      saveCheckpoint(cp);
    }
  }
  fs.writeFileSync(path.join(CONTENT_DIR, 'devotionals.es.json'), JSON.stringify(es, null, 1));
  console.log('  wrote devotionals.es.json');
}

async function generateAdvent() {
  const outPath = path.join(CONTENT_DIR, 'seasonal/advent.es.json');
  if (fs.existsSync(outPath)) {
    console.log('Advent ES already exists, skipping.');
    return;
  }
  console.log('Translating advent overlay...');
  const en = JSON.parse(fs.readFileSync(path.join(CONTENT_DIR, 'seasonal/advent.json'), 'utf8'));
  const [name] = await translateBatch([en.name]);
  const days = [];
  for (const d of en.days) {
    const [label, readingNote, devotionalNote, prayerNote] = await translateBatch([
      d.label,
      d.readingNote ?? '',
      d.devotionalNote ?? '',
      d.prayerNote ?? '',
    ]);
    days.push({
      week: d.week,
      label,
      readingNote: readingNote || undefined,
      devotionalNote: devotionalNote || undefined,
      prayerNote: prayerNote || undefined,
    });
  }
  fs.writeFileSync(
    outPath,
    JSON.stringify(
      { id: en.id, name, startMonthDay: en.startMonthDay, endMonthDay: en.endMonthDay, days },
      null,
      2
    )
  );
  console.log('  wrote seasonal/advent.es.json');
}

async function main() {
  const cp = loadCheckpoint();
  await generateAdvent();
  await generateGuidance(cp);
  await generateReadingPlanOverlay(cp);
  await generatePrayers(cp);
  await generateDevotionals(cp);
  fs.unlinkSync(CHECKPOINT_FILE);
  console.log('Done!');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
