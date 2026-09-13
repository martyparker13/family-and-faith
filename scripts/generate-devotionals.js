#!/usr/bin/env node
/**
 * Generates content/devotionals.json — 365 family devotionals.
 *
 * 20 hand-written themes (scripts/data/devotional-themes-*.js) cycle through
 * the year (~18 appearances each). On each appearance a different combination
 * of intro / story / application / verse / questions / challenge is selected,
 * so no two devotionals in the year are identical, while the voice stays
 * consistent. Anchor-verse text is fetched in the WEB translation from
 * bible-api.com (cached in scripts/.cache/verses.json).
 *
 * Run: node scripts/generate-devotionals.js
 */
const fs = require('fs');
const path = require('path');
const { getVerseText } = require('./lib/web-verses');

const themes = [...require('./data/devotional-themes-1'), ...require('./data/devotional-themes-2')];

/** Bridging sentences between the story and the application paragraph. */
const BRIDGES = [
  'Stories like that one are little windows into something God has been saying all along.',
  'Maybe something like that has happened at your house too — most families know the feeling.',
  'It is a small story, but it points to a big truth that runs all through the Bible.',
  'Kids and grown-ups both know how that feels — and God speaks right into moments like these.',
  'That is everyday life — and everyday life is exactly where God loves to teach us.',
  'Hold onto that picture for a moment, because Scripture has something beautiful to add to it.',
  'Moments like that are worth talking about together, because they show us how God works.',
  'It sounds simple, but simple moments like these carry some of God\'s deepest lessons.',
  'Whether you are five or fifty, that feeling is familiar — and God meets us right there.',
  'That little scene is the kind of thing Jesus loved to teach about — ordinary life, extraordinary truth.',
];

/** Warm closing sentences rotated onto the end of each reflection. */
const CLOSERS = [
  'Tonight, talk about it together — and let God do something small and wonderful in your family.',
  'May God grow this truth in every heart at your table today.',
  'Whatever today brings, walk through it together — God is walking with you.',
  'Take it slow, talk it out, and watch for God in the little moments today.',
  'God is not finished with any of us yet — and that is very good news.',
  'Let this be something your family practices together, one small step at a time.',
  'Big faith grows from little conversations just like this one.',
  'May your home be a place where this truth feels at home too.',
  'Ask God to make this real in your family this week — He loves that kind of prayer.',
  'And remember: God delights in families who seek Him together, just like yours is doing right now.',
];

function pickTwo(arr, seed) {
  const first = seed % arr.length;
  let second = (seed * 2 + 3) % arr.length;
  if (second === first) second = (second + 1) % arr.length;
  return [arr[first], arr[second]];
}

async function main() {
  if (themes.length !== 20) throw new Error(`Expected 20 themes, got ${themes.length}`);

  // Validate theme shape before doing anything slow.
  for (const t of themes) {
    for (const [key, min] of [
      ['titles', 3],
      ['verseRefs', 4],
      ['intros', 3],
      ['stories', 3],
      ['applications', 3],
      ['littleQs', 6],
      ['olderQs', 6],
      ['challenges', 5],
    ]) {
      if (!Array.isArray(t[key]) || t[key].length < min) {
        throw new Error(`Theme "${t.id}" needs at least ${min} ${key}`);
      }
    }
  }

  // Fetch all anchor verse texts up front (cached after first run).
  const allRefs = [...new Set(themes.flatMap((t) => t.verseRefs))];
  console.log(`Fetching ${allRefs.length} anchor verses (WEB)...`);
  const verseText = {};
  for (const ref of allRefs) {
    verseText[ref] = await getVerseText(ref);
    process.stdout.write('.');
  }
  console.log(' done');

  const devotionals = [];
  for (let day = 1; day <= 365; day++) {
    const theme = themes[(day - 1) % themes.length];
    // "use" counts how many times this theme has appeared (0-based); it
    // drives the rotation through every content pool.
    const use = Math.floor((day - 1) / themes.length);

    const intro = theme.intros[use % 3];
    const story = theme.stories[Math.floor(use / 3) % 3];
    const application = theme.applications[Math.floor(use / 9) % 3];
    const bridge = BRIDGES[(day + 3) % BRIDGES.length];
    const closer = CLOSERS[(day - 1) % CLOSERS.length];
    const ref = theme.verseRefs[use % theme.verseRefs.length];

    const [littleA, littleB] = pickTwo(theme.littleQs, use);
    const [olderA, olderB] = pickTwo(theme.olderQs, use + 1);

    devotionals.push({
      day,
      title: theme.titles[use % theme.titles.length],
      theme: theme.name,
      scripture: { reference: ref, text: verseText[ref] },
      reflection: `${intro}\n\n${story}\n\n${bridge} ${application} ${closer}`,
      questions: [
        { audience: 'little', question: littleA },
        { audience: 'little', question: littleB },
        { audience: 'older', question: olderA },
        { audience: 'older', question: olderB },
      ],
      familyChallenge: theme.challenges[use % theme.challenges.length],
    });
  }

  // ---- Validation ----
  if (devotionals.length !== 365) throw new Error('Expected 365 devotionals');
  for (const d of devotionals) {
    const words = d.reflection.split(/\s+/).length;
    if (words < 150 || words > 400) {
      throw new Error(`Day ${d.day} reflection is ${words} words — outside 150–400`);
    }
    if (!d.scripture.text) throw new Error(`Day ${d.day} missing verse text`);
    if (d.questions.length !== 4) throw new Error(`Day ${d.day} question count`);
  }
  // No two consecutive days should share a theme (guaranteed by cycling, but verify).
  for (let i = 1; i < devotionals.length; i++) {
    if (devotionals[i].theme === devotionals[i - 1].theme) {
      throw new Error(`Days ${i} and ${i + 1} share a theme`);
    }
  }

  const outPath = path.join(__dirname, '..', 'content', 'devotionals.json');
  fs.writeFileSync(outPath, JSON.stringify(devotionals, null, 1));
  const totalWords = devotionals.reduce((s, d) => s + d.reflection.split(/\s+/).length, 0);
  console.log(
    `✔ Wrote 365 devotionals (avg ${Math.round(totalWords / 365)} words/reflection) to ${outPath}`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
