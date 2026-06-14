/**
 * Fetches World English Bible verse text from bible-api.com for the content
 * generators, with a persistent file cache (scripts/.cache/verses.json) so
 * regenerating content never re-downloads, and a polite throttle.
 */
const fs = require('fs');
const path = require('path');

const CACHE_DIR = path.join(__dirname, '..', '.cache');
const CACHE_FILE = path.join(CACHE_DIR, 'verses.json');

let cache = {};
if (fs.existsSync(CACHE_FILE)) {
  cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
}

function saveCache() {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 1));
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Returns the WEB text for a reference like "John 3:16" or
 * "Philippians 4:6-7" as a single normalized string.
 */
async function getVerseText(reference) {
  if (cache[reference]) return cache[reference];

  const url = `https://bible-api.com/${encodeURIComponent(reference)}?translation=web`;
  let lastError = new Error(`Failed to fetch "${reference}"`);
  for (let attempt = 1; attempt <= 6; attempt++) {
    try {
      const res = await fetch(url);
      if (res.status === 429) {
        // Rate limited — back off generously and retry.
        lastError = new Error(`Rate limited (429) for "${reference}"`);
        await sleep(8000 * attempt);
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status} for "${reference}"`);
      const data = await res.json();
      if (!data.verses) throw new Error(`No verses for "${reference}": ${JSON.stringify(data)}`);
      const text = data.verses
        .map((v) => v.text.replace(/\s+/g, ' ').trim())
        .join(' ')
        .trim();
      cache[reference] = text;
      saveCache();
      await sleep(1100); // be kind to the free API
      return text;
    } catch (err) {
      lastError = err;
      await sleep(2000 * attempt);
    }
  }
  throw lastError;
}

module.exports = { getVerseText };
