#!/usr/bin/env node
/**
 * Generates Spanish content JSON from English source files.
 * Outputs: devotionals.es.json, prayers.es.json, guidance-topics.es.json,
 * reading-plan.es.json (overlay), seasonal/advent.es.json
 *
 * Usage: node scripts/generate-spanish-content.js
 */
const fs = require('fs');
const path = require('path');
const { translate } = require('@vitalets/google-translate-api');

const CONTENT_DIR = path.join(__dirname, '..', 'content');
const DELAY_MS = 200;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function translateText(text, retries = 3) {
  if (!text || !text.trim()) return text;
  for (let i = 0; i < retries; i++) {
    try {
      const result = await translate(text, { from: 'en', to: 'es' });
      await sleep(DELAY_MS);
      return result.text;
    } catch (err) {
      if (i === retries - 1) {
        console.warn('Translation failed, keeping EN:', text.slice(0, 60), err.message);
        return text;
      }
      await sleep(1000 * (i + 1));
    }
  }
  return text;
}

async function translateBatch(texts) {
  const results = [];
  for (const text of texts) {
    results.push(await translateText(text));
  }
  return results;
}

async function generateDevotionals() {
  console.log('Translating devotionals...');
  const en = JSON.parse(fs.readFileSync(path.join(CONTENT_DIR, 'devotionals.json'), 'utf8'));
  const es = [];
  for (let i = 0; i < en.length; i++) {
    const d = en[i];
    if (i % 10 === 0) console.log(`  devotional ${i + 1}/365`);
    const [title, theme, scriptureText, reflection, familyChallenge] = await translateBatch([
      d.title,
      d.theme,
      d.scripture.text,
      d.reflection,
      d.familyChallenge,
    ]);
    const questions = [];
    for (const q of d.questions) {
      questions.push({ audience: q.audience, question: await translateText(q.question) });
    }
    es.push({
      day: d.day,
      title,
      theme,
      scripture: { reference: d.scripture.reference, text: scriptureText },
      reflection,
      questions,
      familyChallenge,
    });
  }
  fs.writeFileSync(path.join(CONTENT_DIR, 'devotionals.es.json'), JSON.stringify(es, null, 1));
  console.log('  wrote devotionals.es.json');
}

async function generatePrayers() {
  console.log('Translating prayers...');
  const en = JSON.parse(fs.readFileSync(path.join(CONTENT_DIR, 'prayers.json'), 'utf8'));
  const es = [];
  for (let i = 0; i < en.length; i++) {
    const p = en[i];
    if (i % 20 === 0) console.log(`  prayer ${i + 1}/365`);
    const [theme, title, togetherLine] = await translateBatch([p.theme, p.title, p.togetherLine]);
    const lines = [];
    for (const line of p.lines) {
      lines.push(await translateText(line));
    }
    es.push({ day: p.day, theme, title, lines, togetherLine });
  }
  fs.writeFileSync(path.join(CONTENT_DIR, 'prayers.es.json'), JSON.stringify(es, null, 1));
  console.log('  wrote prayers.es.json');
}

async function generateGuidance() {
  console.log('Translating guidance topics...');
  const en = JSON.parse(fs.readFileSync(path.join(CONTENT_DIR, 'guidance-topics.json'), 'utf8'));
  const es = [];
  for (let i = 0; i < en.length; i++) {
    const t = en[i];
    console.log(`  topic ${i + 1}/${en.length}: ${t.id}`);
    const [name, category, note] = await translateBatch([t.name, t.category, t.note]);
    const keywords = await translateBatch(t.keywords);
    const verses = [];
    for (const v of t.verses) {
      verses.push({ reference: v.reference, text: await translateText(v.text) });
    }
    es.push({ id: t.id, name, category, keywords, note, verses });
  }
  fs.writeFileSync(path.join(CONTENT_DIR, 'guidance-topics.es.json'), JSON.stringify(es, null, 1));
  console.log('  wrote guidance-topics.es.json');
}

async function generateReadingPlanOverlay() {
  console.log('Translating reading plan overlay...');
  const en = JSON.parse(fs.readFileSync(path.join(CONTENT_DIR, 'reading-plan.json'), 'utf8'));
  const es = [];
  for (let i = 0; i < en.length; i++) {
    const d = en[i];
    if (i % 20 === 0) console.log(`  day ${i + 1}/365`);
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
    es.push(entry);
  }
  fs.writeFileSync(path.join(CONTENT_DIR, 'reading-plan.es.json'), JSON.stringify(es, null, 1));
  console.log('  wrote reading-plan.es.json');
}

async function generateAdvent() {
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
  const es = { id: en.id, name, startMonthDay: en.startMonthDay, endMonthDay: en.endMonthDay, days };
  fs.writeFileSync(path.join(CONTENT_DIR, 'seasonal/advent.es.json'), JSON.stringify(es, null, 2));
  console.log('  wrote seasonal/advent.es.json');
}

async function main() {
  await generateAdvent();
  await generateGuidance();
  await generateReadingPlanOverlay();
  await generatePrayers();
  await generateDevotionals();
  console.log('Done!');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
