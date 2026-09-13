# Faith & Family 🏡✝️

A warm, family-friendly Bible app for reading, talking, and praying through
the whole Bible in a year — together. Built with Expo (managed workflow),
TypeScript, and expo-router. Everything is stored on-device: no accounts, no
backend.

## Running the app

```bash
npm install
npx expo start
```

Then scan the QR code with **Expo Go** on iOS or Android (or press `i` / `a`
for a simulator).

Quality checks:

```bash
npm run lint        # ESLint (expo config + prettier)
npx tsc --noEmit    # TypeScript
npm test            # Jest unit tests (streak/date math, content integrity)
```

## Device builds (EAS)

Expo Go is great for development, but **scheduled daily reminders do not fire
inside Expo Go on Android** — they need a real build. `eas.json` ships with
three profiles:

```bash
npm i -g eas-cli && eas login   # one-time, free Expo account
npm run build:dev               # development build (install + use with the dev server)
npm run build:preview           # internal-distribution build for family testers
eas build --profile production  # store-ready build
```

## What's inside

| Feature | Where | Notes |
| --- | --- | --- |
| **Today dashboard** | `app/(tabs)/index.tsx` | Date, "Day N of 365", streak flame, the three daily cards, Guidance entry |
| **Daily Readings** | `app/day/[day]/reading.tsx` | WEB text from bible-api.com with permanent on-device caching, kid recap, text size, read-aloud (expo-speech), mark complete |
| **Reading Plan list** | `app/(tabs)/plan.tsx` | All 365 days, catch up on missed days |
| **Devotionals** | `app/day/[day]/devotional.tsx` | Anchor verse, reflection, tiered tap-to-reveal questions, family challenge |
| **Family Prayers** | `app/day/[day]/prayer.tsx` | Read-aloud layout, fill-in-the-blank moments, prayer mode |
| **Prayer list** | `app/prayer-list.tsx` | Requests + Answered Prayers history |
| **Scripture Guidance** | `app/(tabs)/guidance.tsx`, `app/guidance/[id].tsx` | fuse.js fuzzy search over 64 curated topics, browse grid, verse cards with favorite/copy/share |
| **Favorites** | `app/(tabs)/favorites.tsx` | Saved verses |
| **Family Journal** | `app/journal.tsx` | One line a day — a keepsake of the family's year in the Word |
| **Memory verse** | Today screen | Weekly verse with "we practiced it" tracking |
| **Celebrations** | `components/Confetti.tsx`, `lib/celebrate.ts` | Haptics + confetti on completions, streak milestones, answered prayers |
| **Onboarding** | `app/onboarding.tsx` | Family name, plan start date, daily reminder time (presets or custom picker) |
| **Settings** | `app/(tabs)/settings.tsx` | Theme, text size, read-aloud speed, reminder, offline download, restart/reset options |

## Project structure

```
app/          expo-router routes (file-based navigation)
components/   custom component library (AppText, Card, AppButton, …)
content/      bundled JSON content — generated, see below
lib/          utilities & hooks (bible api client, dates, search, theme context)
store/        zustand stores persisted to AsyncStorage
theme/        palette, typography, spacing tokens
scripts/      node generators that produce content/*.json
```

## Content pipeline

All app content is bundled JSON in `content/`, produced by plain-Node
generators in `scripts/`. Verse text is fetched **once at generation time**
from [bible-api.com](https://bible-api.com) in the public-domain **World
English Bible (WEB)** translation and cached in `scripts/.cache/verses.json`,
so regenerating is fast and the app itself ships with the text it needs.

| File | Generator | Shape |
| --- | --- | --- |
| `content/reading-plan.json` | `scripts/generate-reading-plan.js` | 365 days × `{ day, passages[{reference, apiQueries[], track}], kidSummary }`. Two tracks: OT story (2–3 chapters) + NT/Psalms/Proverbs portion. Every one of the Bible's 1,189 chapters appears exactly once (validated). |
| `content/devotionals.json` | `scripts/generate-devotionals.js` | 365 × `{ day, title, theme, scripture{reference,text}, reflection, questions[{audience: little\|older, question}], familyChallenge }`. Assembled from 20 hand-written themes in `scripts/data/devotional-themes-*.js`. |
| `content/prayers.json` | `scripts/generate-prayers.js` | 365 × `{ day, theme, title, lines[], togetherLine }`. Lines containing `______` are fill-in-the-blank moments. From 14 themes in `scripts/data/prayer-themes.js`. |
| `content/guidance-topics.json` | `scripts/generate-guidance.js` | 64 topics × `{ id, name, category, keywords[], note, verses[{reference,text}] }` across 16 life categories. Hand-curated in `scripts/data/guidance-topics-*.js`. |

To expand the content, edit the data files in `scripts/data/` and re-run the
matching generator:

```bash
node scripts/generate-reading-plan.js
node scripts/generate-devotionals.js
node scripts/generate-prayers.js
node scripts/generate-guidance.js
```

Each generator validates its output (counts, word ranges, no duplicate
chapters, fill-in-the-blank presence, …) before writing.

## Bible text at runtime

The daily reading screen fetches chapter text from bible-api.com (WEB, one
chapter per request) through `lib/bible.ts`, which caches every chapter
permanently in AsyncStorage — so each day's reading needs the network only
the first time, then works fully offline.

## Design notes

- **Palette** (`theme/colors.ts`): soft creams, warm golds, gentle blues and
  greens — light and dark mode both stay warm.
- **Type** (`theme/typography.ts`): Lora (serif) for scripture and display,
  Nunito (rounded sans) for UI. A user text-size setting scales all reading
  text; system font scaling (dynamic type) is also respected.
- **Accessibility**: 48pt minimum touch targets, screen-reader labels and
  hints on interactive elements, progress bars expose accessibility values.

## License

Code: MIT. Scripture: World English Bible (public domain). Devotional,
prayer, and guidance content: written for this project — share freely.
