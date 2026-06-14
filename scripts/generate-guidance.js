#!/usr/bin/env node
/**
 * Generates content/guidance-topics.json — the curated Scripture Guidance
 * index (64 topics across 16 life categories). Topic data is hand-written in
 * scripts/data/guidance-topics-*.js; this script validates it, fetches each
 * passage's text in the WEB translation from bible-api.com (cached), and
 * writes the final bundle the app searches with fuse.js.
 *
 * Run: node scripts/generate-guidance.js
 */
const fs = require('fs');
const path = require('path');
const { getVerseText } = require('./lib/web-verses');

const topics = [...require('./data/guidance-topics-1'), ...require('./data/guidance-topics-2')];

async function main() {
  // ---- Validate before any network work ----
  if (topics.length < 60) throw new Error(`Need at least 60 topics, got ${topics.length}`);
  const ids = new Set();
  for (const t of topics) {
    if (!t.id || ids.has(t.id)) throw new Error(`Missing/duplicate topic id: ${t.id}`);
    ids.add(t.id);
    if (!t.name || !t.category) throw new Error(`Topic ${t.id} missing name/category`);
    if (!Array.isArray(t.keywords) || t.keywords.length < 6) {
      throw new Error(`Topic ${t.id} needs at least 6 keywords`);
    }
    if (!t.note || t.note.split('.').length < 2) throw new Error(`Topic ${t.id} note too short`);
    if (!Array.isArray(t.verseRefs) || t.verseRefs.length < 4 || t.verseRefs.length > 8) {
      throw new Error(`Topic ${t.id} needs 4–8 verses, has ${t.verseRefs?.length}`);
    }
  }
  const categories = new Set(topics.map((t) => t.category));
  console.log(`Validated ${topics.length} topics across ${categories.size} categories.`);

  // ---- Fetch verse text (WEB) ----
  const allRefs = [...new Set(topics.flatMap((t) => t.verseRefs))];
  console.log(`Fetching ${allRefs.length} unique passages (WEB)...`);
  const verseText = {};
  for (const ref of allRefs) {
    verseText[ref] = await getVerseText(ref);
    process.stdout.write('.');
  }
  console.log(' done');

  const output = topics.map((t) => ({
    id: t.id,
    name: t.name,
    category: t.category,
    keywords: t.keywords,
    note: t.note,
    verses: t.verseRefs.map((ref) => ({ reference: ref, text: verseText[ref] })),
  }));

  for (const t of output) {
    for (const v of t.verses) {
      if (!v.text || v.text.length < 10) throw new Error(`Bad text for ${v.reference} in ${t.id}`);
    }
  }

  const outPath = path.join(__dirname, '..', 'content', 'guidance-topics.json');
  fs.writeFileSync(outPath, JSON.stringify(output, null, 1));
  console.log(`✔ Wrote ${output.length} guidance topics to ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
