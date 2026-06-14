#!/usr/bin/env node
/**
 * Generates content/prayers.json — 365 daily family prayers.
 *
 * 14 hand-written themes (scripts/data/prayer-themes.js) cycle through the
 * year (~26 appearances each). Each appearance combines a different opening,
 * middle, fill-in-the-blank moment, and ask, so prayers stay varied. Every
 * prayer ends with a short line the family repeats together.
 *
 * Run: node scripts/generate-prayers.js
 */
const fs = require('fs');
const path = require('path');

const themes = require('./data/prayer-themes');

function main() {
  if (themes.length !== 14) throw new Error(`Expected 14 prayer themes, got ${themes.length}`);
  for (const t of themes) {
    for (const [key, min] of [
      ['titles', 3],
      ['openings', 4],
      ['middles', 4],
      ['blanks', 4],
      ['asks', 4],
      ['togetherLines', 3],
    ]) {
      if (!Array.isArray(t[key]) || t[key].length < min) {
        throw new Error(`Prayer theme "${t.id}" needs at least ${min} ${key}`);
      }
    }
  }

  const prayers = [];
  for (let day = 1; day <= 365; day++) {
    const theme = themes[(day - 1) % themes.length];
    // How many times this theme has appeared so far (0-based) — drives the
    // rotation through each pool with offsets so combinations vary.
    const use = Math.floor((day - 1) / themes.length);

    const opening = theme.openings[use % 4];
    const middleIndex = Math.floor(use / 4) % 4;
    const middle = theme.middles[middleIndex];
    // A second, different middle stanza keeps prayers in the 80–150 word
    // range and lets each family member take a line when praying aloud.
    const secondMiddle = theme.middles[(middleIndex + 1 + (use % 3)) % 4];
    const blank = theme.blanks[(use + 2) % 4];
    const ask = theme.asks[(use * 3 + Math.floor(use / 4)) % 4];
    const together = theme.togetherLines[use % theme.togetherLines.length];

    const middles = secondMiddle === middle ? middle : [...middle, ...secondMiddle];

    prayers.push({
      day,
      theme: theme.name,
      title: theme.titles[use % theme.titles.length],
      lines: [opening, ...middles, blank, ask],
      togetherLine: together,
    });
  }

  // ---- Validation ----
  if (prayers.length !== 365) throw new Error('Expected 365 prayers');
  for (const p of prayers) {
    const words = [...p.lines, p.togetherLine].join(' ').split(/\s+/).length;
    if (words < 40 || words > 160) {
      throw new Error(`Day ${p.day} prayer is ${words} words — outside 40–160`);
    }
    if (!p.lines.some((l) => l.includes('______'))) {
      throw new Error(`Day ${p.day} prayer missing fill-in-the-blank line`);
    }
  }

  const outPath = path.join(__dirname, '..', 'content', 'prayers.json');
  fs.writeFileSync(outPath, JSON.stringify(prayers, null, 1));
  const totalWords = prayers.reduce(
    (s, p) => s + [...p.lines, p.togetherLine].join(' ').split(/\s+/).length,
    0
  );
  console.log(`✔ Wrote 365 prayers (avg ${Math.round(totalWords / 365)} words) to ${outPath}`);
}

main();
