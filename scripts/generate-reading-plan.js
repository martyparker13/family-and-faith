#!/usr/bin/env node
/**
 * Generates content/reading-plan.json — a 365-day, family-paced Bible-in-a-
 * year plan using two parallel tracks:
 *
 *   Track 1 (OT story):   the Old Testament minus Psalms/Proverbs
 *                         (748 chapters) in 2-chapter chunks (3 for the
 *                         census/genealogy-heavy books) that never cross a
 *                         book boundary. Exactly 365 chunks.
 *
 *   Track 2 (NT/wisdom):  the New Testament one chapter a day, interleaved
 *                         evenly with Psalms (mostly in pairs) and Proverbs,
 *                         so the family is regularly in the Gospels and the
 *                         Psalms all year. Exactly 365 portions.
 *
 * Every chapter of the Bible appears exactly once. The script is pure data —
 * no network — and validates its own output before writing.
 *
 * Run: node scripts/generate-reading-plan.js
 */
const fs = require('fs');
const path = require('path');

// [name, chapters, chunkSize] — chunkSize 3 for list-heavy books keeps the
// total at exactly 365 OT chunks while sparing families long slogs elsewhere.
const OT_BOOKS = [
  ['Genesis', 50, 2],
  ['Exodus', 40, 2],
  ['Leviticus', 27, 3],
  ['Numbers', 36, 3],
  ['Deuteronomy', 34, 2],
  ['Joshua', 24, 2],
  ['Judges', 21, 2],
  ['Ruth', 4, 2],
  ['1 Samuel', 31, 2],
  ['2 Samuel', 24, 2],
  ['1 Kings', 22, 2],
  ['2 Kings', 25, 2],
  ['1 Chronicles', 29, 3],
  ['2 Chronicles', 36, 2],
  ['Ezra', 10, 2],
  ['Nehemiah', 13, 2],
  ['Esther', 10, 2],
  ['Job', 42, 2],
  ['Ecclesiastes', 12, 2],
  ['Song of Solomon', 8, 2],
  ['Isaiah', 66, 2],
  ['Jeremiah', 52, 2],
  ['Lamentations', 5, 2],
  ['Ezekiel', 48, 2],
  ['Daniel', 12, 2],
  ['Hosea', 14, 2],
  ['Joel', 3, 2],
  ['Amos', 9, 2],
  ['Obadiah', 1, 2],
  ['Jonah', 4, 2],
  ['Micah', 7, 2],
  ['Nahum', 3, 2],
  ['Habakkuk', 3, 2],
  ['Zephaniah', 3, 2],
  ['Haggai', 2, 2],
  ['Zechariah', 14, 2],
  ['Malachi', 4, 2],
];

const NT_BOOKS = [
  ['Matthew', 28],
  ['Mark', 16],
  ['Luke', 24],
  ['John', 21],
  ['Acts', 28],
  ['Romans', 16],
  ['1 Corinthians', 16],
  ['2 Corinthians', 13],
  ['Galatians', 6],
  ['Ephesians', 6],
  ['Philippians', 4],
  ['Colossians', 4],
  ['1 Thessalonians', 5],
  ['2 Thessalonians', 3],
  ['1 Timothy', 6],
  ['2 Timothy', 4],
  ['Titus', 3],
  ['Philemon', 1],
  ['Hebrews', 13],
  ['James', 5],
  ['1 Peter', 5],
  ['2 Peter', 3],
  ['1 John', 5],
  ['2 John', 1],
  ['3 John', 1],
  ['Jude', 1],
  ['Revelation', 22],
];

// Psalms read alone (very long); every other psalm is read as a pair.
const SOLO_PSALMS = new Set([78, 119]);
// Proverbs chapters read as pairs (the rest are singles).
const PROVERB_PAIRS = [
  [6, 7],
  [10, 11],
  [26, 27],
];

/**
 * Kid-friendly summaries for the OT storyline. For each book: an ordered list
 * of [lastChapterOfRange, summary]. A day's summary is looked up from the
 * range containing the day's first OT chapter.
 */
const KID_SUMMARIES = {
  Genesis: [
    [2, 'Today we read how God creates the whole world — light, seas, animals, and the very first people!'],
    [5, "Today we read about Adam and Eve's sad choice in the garden, and the family that came after them."],
    [9, 'Today we read about Noah building a giant boat to save his family and the animals from the flood!'],
    [11, 'Today we read about the tower of Babel, where God gave people all their different languages.'],
    [16, "Today we read God's special promise to Abraham: his family will bless the whole world."],
    [24, 'Today we read how God kept His promise to Abraham and Sarah with a baby named Isaac.'],
    [28, "Today we read about Isaac's twin sons, Jacob and Esau, and some hard family lessons."],
    [36, 'Today we read how Jacob raised a big family and finally made peace with his brother Esau.'],
    [41, 'Today we read about Joseph, sold by his jealous brothers — but God stayed with him in Egypt.'],
    [47, 'Today we read how Joseph forgave his brothers and saved his whole family from hunger.'],
    [50, 'Today we read how Joseph reminded his family that God can turn bad things into good.'],
  ],
  Exodus: [
    [2, 'Today we read about baby Moses, hidden in a basket on the river and kept safe by God.'],
    [6, 'Today we read how God spoke to Moses from a burning bush and sent him to free His people.'],
    [11, 'Today we read about the mighty plagues God sent to show Pharaoh that He is the true God.'],
    [15, 'Today we read how God split the Red Sea so His people could escape — the biggest rescue ever!'],
    [18, 'Today we read how God fed His people in the desert with special bread from heaven called manna.'],
    [24, 'Today we read about the Ten Commandments — good rules for loving God and loving each other.'],
    [31, "Today we read God's plans for the tabernacle, a special tent where He would meet His people."],
    [34, 'Today we read about the golden calf mistake, and how Moses prayed and God forgave.'],
    [40, "Today we read how the people built God's tent just right — and God's glory filled it!"],
  ],
  Leviticus: [
    [7, 'Today we read how God taught His people to bring offerings to say sorry and thank You.'],
    [10, 'Today we read about Aaron and his sons becoming priests who helped the people worship God.'],
    [15, 'Today we read some of the rules God gave to keep His people healthy and well.'],
    [17, "Today we read about a special day each year when the people's sins were forgiven."],
    [22, 'Today we read how God asked His people to live holy lives — set apart and loving.'],
    [25, 'Today we read about the feasts and rest days God planned so His people could celebrate Him.'],
    [27, 'Today we read the blessings God promised to people who follow Him with all their hearts.'],
  ],
  Numbers: [
    [4, 'Today we read how God counted His people and organized their big camp in the desert.'],
    [8, "Today we read how every family got a special job helping care for God's tent."],
    [10, "Today we read how the people followed God's cloud — when it moved, they moved!"],
    [14, 'Today we read about the twelve spies — and how only Joshua and Caleb trusted God.'],
    [17, 'Today we read how God showed everyone He had chosen Moses and Aaron to lead.'],
    [21, 'Today we read how God kept caring for His grumbling people — even giving water from a rock.'],
    [25, 'Today we read about Balaam and his talking donkey, and how God protected His people.'],
    [30, 'Today we read how a new generation got counted and ready for the promised land.'],
    [36, "Today we read how Israel camped at the very edge of the land God promised them."],
  ],
  Deuteronomy: [
    [3, 'Today we read Moses reminding the people of everything God did for them in the desert.'],
    [6, 'Today we read the most important rule of all: love God with all your heart!'],
    [11, "Today we read Moses telling the people to remember God's love and never forget it."],
    [16, 'Today we read how God taught His people to be generous and to celebrate together.'],
    [26, "Today we read rules God gave to help His people treat everyone fairly and kindly."],
    [30, 'Today we read Moses saying: choose life! Loving God is the best choice of all.'],
    [34, 'Today we read Moses saying goodbye and blessing Joshua as the new leader.'],
  ],
  Joshua: [
    [2, 'Today we read how Joshua got ready to lead, and how brave Rahab helped God’s people.'],
    [6, 'Today we read how the walls of Jericho came tumbling down when the people trusted God!'],
    [8, 'Today we read how Israel learned that obeying God matters more than winning.'],
    [12, 'Today we read how God fought for His people — He even made the sun stand still!'],
    [21, 'Today we read how every family in Israel received their own piece of the promised land.'],
    [24, 'Today we read Joshua’s famous words: as for me and my house, we will serve the Lord!'],
  ],
  Judges: [
    [3, 'Today we read how God sent special helpers called judges to rescue His forgetful people.'],
    [5, 'Today we read about brave Deborah, who trusted God and led Israel to victory.'],
    [8, 'Today we read how God helped Gideon win with only 300 men, some torches, and trumpets!'],
    [12, 'Today we read how Israel kept forgetting God — but He never stopped hearing their cries.'],
    [16, 'Today we read about strong Samson, who learned that real strength comes from God.'],
    [21, 'Today we read what happens when everyone does whatever they want — it goes badly!'],
  ],
  Ruth: [
    [2, 'Today we read how Ruth stayed loyal to Naomi, and how God took care of them both.'],
    [4, "Today we read how Ruth's new family became part of King David's — and Jesus' — story!"],
  ],
  '1 Samuel': [
    [3, "Today we read how God answered Hannah's prayer with baby Samuel, who learned to listen to God."],
    [7, 'Today we read how the ark of God reminded everyone that God is holy and mighty.'],
    [12, 'Today we read how Israel asked for a king, and Samuel anointed Saul.'],
    [15, 'Today we read how King Saul learned that obeying God matters more than anything.'],
    [17, 'Today we read how young David defeated the giant Goliath with a sling and great faith!'],
    [24, 'Today we read about Jonathan and David, who show us what true friendship looks like.'],
    [31, "Today we read how David waited for God's timing, even when life was unfair."],
  ],
  '2 Samuel': [
    [4, 'Today we read how David became king and remembered to ask God before he acted.'],
    [7, "Today we read God's promise that David's family would lead forever — pointing to Jesus!"],
    [10, 'Today we read how David showed kindness to Mephibosheth to keep a promise to his friend.'],
    [12, 'Today we read how David made a big mistake — and said sorry to God with his whole heart.'],
    [19, "Today we read about hard times in David's family, and how God stayed faithful."],
    [24, 'Today we read David singing praise to the God who rescued him again and again.'],
  ],
  '1 Kings': [
    [4, 'Today we read how Solomon became king and asked God for wisdom instead of riches.'],
    [8, 'Today we read how Solomon built a beautiful temple and prayed a wonderful prayer.'],
    [11, 'Today we read how even the wisest king had to learn to keep his heart close to God.'],
    [16, 'Today we read how the kingdom split in two, and many kings forgot God.'],
    [19, 'Today we read how Elijah prayed, fire fell from heaven, and God spoke in a gentle whisper.'],
    [22, 'Today we read how God patiently kept speaking the truth through His prophets.'],
  ],
  '2 Kings': [
    [4, "Today we read about Elisha's amazing miracles that showed God's kind care."],
    [8, 'Today we read how Naaman was healed when he humbly obeyed God’s simple instructions.'],
    [12, 'Today we read how God protected the royal family He had promised to David.'],
    [17, 'Today we read how Israel kept forgetting God, and sad consequences followed.'],
    [20, 'Today we read how good King Hezekiah prayed, and God answered powerfully.'],
    [25, "Today we read about kings who forgot God — and young Josiah, who found God's book and obeyed it."],
  ],
  '1 Chronicles': [
    [9, "Today we read a long family list that reminds us every single person matters in God's story."],
    [12, "Today we read how David's mighty men gathered to make him king, just as God planned."],
    [16, 'Today we read how David brought the ark home with singing, dancing, and thankful praise!'],
    [21, "Today we read God's promise to David of a kingdom that never ends."],
    [27, "Today we read how David gathered everything needed to build God's temple."],
    [29, "Today we read David's prayer: everything we have comes from You, God!"],
  ],
  '2 Chronicles': [
    [5, 'Today we read how Solomon built the temple, a beautiful house for worshiping God.'],
    [9, 'Today we read how the queen of Sheba visited and saw how God had blessed Solomon.'],
    [16, "Today we read how kings who trusted God found help — and kings who didn't found trouble."],
    [20, 'Today we read how King Jehoshaphat won a battle by sending singers out front to praise God!'],
    [28, "Today we read how every king had a choice: follow God, or go their own way."],
    [32, 'Today we read how King Hezekiah trusted God when a huge army surrounded the city.'],
    [36, "Today we read how the people heard God's book again and promised to follow Him."],
  ],
  Ezra: [
    [6, 'Today we read how God brought His people home from a faraway land to rebuild the temple.'],
    [10, "Today we read how Ezra taught the people God's word, and they listened with all their hearts."],
  ],
  Nehemiah: [
    [6, 'Today we read how Nehemiah prayed, planned, and rebuilt a whole city wall in 52 days!'],
    [13, "Today we read how the people heard God's word read aloud and celebrated with great joy."],
  ],
  Esther: [
    [4, 'Today we read about brave Queen Esther, getting ready to risk everything for her people.'],
    [10, "Today we read how Esther spoke up 'for such a time as this' — and God saved His people!"],
  ],
  Job: [
    [3, 'Today we read about Job, who lost almost everything but kept talking to God.'],
    [14, "Today we read Job's friends trying to explain his hurt — without knowing the whole story."],
    [21, "Today we read Job asking God hard questions. That's okay — God can handle our questions."],
    [31, 'Today we read how Job kept holding on to God even when nothing made sense.'],
    [37, 'Today we read Elihu reminding everyone that God is greater than we can understand.'],
    [42, 'Today we read God speaking from the storm, and Job discovering how big and good God is.'],
  ],
  Ecclesiastes: [
    [2, 'Today we read about the Teacher who searched everywhere for happiness — and what he found.'],
    [6, 'Today we read that there is a time for everything, and God makes everything beautiful in its time.'],
    [12, 'Today we read the Teacher’s best advice: love God and keep His commands.'],
  ],
  'Song of Solomon': [
    [8, 'Today we read a beautiful song that reminds us love is a wonderful gift from God.'],
  ],
  Isaiah: [
    [6, "Today we read how Isaiah saw God on His throne and said, 'Here am I — send me!'"],
    [12, 'Today we read God’s promise of a special child called Immanuel — God with us.'],
    [23, 'Today we read how God speaks to all the nations — He is King over the whole world.'],
    [27, 'Today we read how God keeps His people safe, like a careful gardener with his vineyard.'],
    [35, 'Today we read about a joyful highway home for everyone God rescues.'],
    [39, 'Today we read how King Hezekiah trusted God when trouble surrounded the city.'],
    [44, "Today we read God's comfort for His people: He gives strength to the weary."],
    [48, 'Today we read that there is no one like our God, who knows the end from the beginning.'],
    [53, 'Today we read about the suffering servant who carries our sorrows — pointing to Jesus.'],
    [58, 'Today we read God inviting everyone who is thirsty to come and be filled.'],
    [66, "Today we read God's promise of new heavens and a new earth, full of joy."],
  ],
  Jeremiah: [
    [2, 'Today we read how God called young Jeremiah and promised to give him the words to say.'],
    [10, 'Today we read Jeremiah telling the people: come back to God with your whole heart.'],
    [17, 'Today we read that trusting God makes you like a tree planted by the water.'],
    [25, 'Today we read how God can reshape His people like clay in a potter’s hands.'],
    [29, "Today we read God's promise: His plans for His people are good — plans of hope and a future."],
    [33, "Today we read God's promise of a new covenant, with His law written on our hearts."],
    [39, 'Today we read how Jeremiah kept telling the truth, even when it landed him in a muddy well.'],
    [45, 'Today we read how God watched over His faithful messenger in sad times.'],
    [52, 'Today we read how God is fair and just with every nation on earth.'],
  ],
  Lamentations: [
    [2, 'Today we read Jeremiah telling God exactly how sad he feels about the broken city.'],
    [3, "Today we read the best news in a sad book: God's mercies are new every morning!"],
    [5, "Today we read how God's people, even in tears, remember He is still King."],
  ],
  Ezekiel: [
    [3, "Today we read Ezekiel's amazing vision of God's glory, shining like a rainbow."],
    [11, "Today we read how God showed Ezekiel why the people's hearts had wandered away."],
    [17, 'Today we read the picture-stories God used to call His people back home.'],
    [24, "Today we read God's promise: I will give you a new heart and a new spirit."],
    [32, 'Today we read how God is in charge of every nation, big and small.'],
    [37, 'Today we read about the valley of dry bones coming alive — God can bring life to anything!'],
    [39, 'Today we read how God protects His people from every enemy.'],
    [48, "Today we read Ezekiel's vision of a new temple with a river of life flowing out of it."],
  ],
  Daniel: [
    [2, 'Today we read how Daniel and his friends stayed faithful to God in a faraway land.'],
    [3, 'Today we read how God saved Shadrach, Meshach, and Abednego from the fiery furnace!'],
    [6, "Today we read how Daniel kept praying — and God shut the lions' mouths."],
    [12, "Today we read Daniel's visions showing that God's kingdom lasts forever."],
  ],
  Hosea: [
    [3, "Today we read Hosea's story of how much God keeps loving His people, no matter what."],
    [7, 'Today we read that God wants our love and loyalty more than anything else.'],
    [14, 'Today we read God’s invitation: come back to Me, and I will heal and love you freely.'],
  ],
  Joel: [
    [3, 'Today we read how a swarm of locusts taught the people to return to God, who restores everything.'],
  ],
  Amos: [
    [4, 'Today we read how Amos the shepherd told everyone that God wants fairness for all people.'],
    [9, 'Today we read God’s call to let justice roll down like a mighty river.'],
  ],
  Obadiah: [
    [1, 'Today we read how God sees when people are treated unfairly — and He makes things right.'],
  ],
  Jonah: [
    [2, 'Today we read how Jonah ran from God and got swallowed by a great fish!'],
    [4, "Today we read how Jonah learned that God loves to forgive — even people we don't like."],
  ],
  Micah: [
    [3, 'Today we read how Micah spoke up for people who were being treated unfairly.'],
    [5, 'Today we read that a special ruler would come from little Bethlehem — the Christmas town!'],
    [7, 'Today we read Micah’s famous words: do justly, love mercy, and walk humbly with your God.'],
  ],
  Nahum: [
    [3, 'Today we read that God is slow to anger but strong to protect His people.'],
  ],
  Habakkuk: [
    [3, 'Today we read how Habakkuk asked God hard questions and learned to rejoice no matter what.'],
  ],
  Zephaniah: [
    [3, 'Today we read that God delights in His people and sings over them with joy!'],
  ],
  Haggai: [
    [2, "Today we read God telling His people: it's time to rebuild My house — and I am with you."],
  ],
  Zechariah: [
    [6, "Today we read Zechariah's visions promising that God will live with His people again."],
    [8, 'Today we read God’s promise of a city full of boys and girls playing safely in the streets.'],
    [11, 'Today we read about a King who comes humbly, riding on a donkey.'],
    [14, 'Today we read that one day the Lord will be King over all the earth.'],
  ],
  Malachi: [
    [2, 'Today we read God reminding His people: I have loved you — bring Me your very best.'],
    [4, 'Today we read God’s promise to send a messenger to get hearts ready for Him.'],
  ],
};

/** bible-api.com book slug (it uses "psalms"; everything else is the name). */
function apiBook(book) {
  return book === 'Psalm' ? 'psalms' : book.toLowerCase();
}

function chapterQueries(book, from, to) {
  const queries = [];
  for (let c = from; c <= to; c++) queries.push(`${apiBook(book)} ${c}`);
  return queries;
}

function refFor(book, from, to) {
  return from === to ? `${book} ${from}` : `${book} ${from}–${to}`;
}

// ---- Track 1: OT chunks ----
function buildOtChunks() {
  const chunks = [];
  for (const [book, chapterCount, size] of OT_BOOKS) {
    let c = 1;
    while (c <= chapterCount) {
      const end = Math.min(c + size - 1, chapterCount);
      chunks.push({
        reference: refFor(book, c, end),
        apiQueries: chapterQueries(book, c, end),
        track: 'ot',
        book,
        firstChapter: c,
        chapters: end - c + 1,
      });
      c = end + 1;
    }
  }
  return chunks;
}

// ---- Track 2: NT chapters + Psalms/Proverbs portions ----
function buildNtPortions() {
  const portions = [];
  for (const [book, chapterCount] of NT_BOOKS) {
    for (let c = 1; c <= chapterCount; c++) {
      portions.push({
        reference: `${book} ${c}`,
        apiQueries: chapterQueries(book, c, c),
        track: 'nt',
        chapters: 1,
      });
    }
  }
  return portions;
}

function buildWisdomPortions() {
  const portions = [];
  // Psalms: pairs, except the two longest which are read alone.
  let p = 1;
  while (p <= 150) {
    if (SOLO_PSALMS.has(p) || p === 150 || SOLO_PSALMS.has(p + 1)) {
      portions.push({
        reference: `Psalm ${p}`,
        apiQueries: [`psalms ${p}`],
        track: 'psalms',
        chapters: 1,
      });
      p += 1;
    } else {
      portions.push({
        reference: `Psalm ${p}–${p + 1}`,
        apiQueries: [`psalms ${p}`, `psalms ${p + 1}`],
        track: 'psalms',
        chapters: 2,
      });
      p += 2;
    }
  }
  // Proverbs: mostly singles, two short pairs.
  const paired = new Map();
  for (const [a, b] of PROVERB_PAIRS) paired.set(a, b);
  const skip = new Set(PROVERB_PAIRS.map(([, b]) => b));
  for (let c = 1; c <= 31; c++) {
    if (skip.has(c)) continue;
    const b = paired.get(c);
    portions.push({
      reference: b ? `Proverbs ${c}–${b}` : `Proverbs ${c}`,
      apiQueries: b ? [`proverbs ${c}`, `proverbs ${b}`] : [`proverbs ${c}`],
      track: 'proverbs',
      chapters: b ? 2 : 1,
    });
  }
  return portions;
}

/** Evenly interleaves NT portions with wisdom portions across 365 days. */
function buildTrack2() {
  const nt = buildNtPortions();
  const wisdom = buildWisdomPortions();
  const total = nt.length + wisdom.length;
  if (total !== 365) {
    throw new Error(`Track 2 must have exactly 365 portions, got ${total}`);
  }
  const result = [];
  let w = 0;
  let n = 0;
  for (let day = 1; day <= 365; day++) {
    const wisdomTarget = Math.round((day * wisdom.length) / 365);
    if (w < wisdomTarget && w < wisdom.length) {
      result.push(wisdom[w++]);
    } else {
      result.push(nt[n++]);
    }
  }
  return result;
}

function kidSummaryFor(otChunk) {
  const ranges = KID_SUMMARIES[otChunk.book];
  if (!ranges) throw new Error(`No kid summaries for ${otChunk.book}`);
  for (const [endChapter, summary] of ranges) {
    if (otChunk.firstChapter <= endChapter) return summary;
  }
  return ranges[ranges.length - 1][1];
}

function main() {
  const otChunks = buildOtChunks();
  if (otChunks.length !== 365) {
    throw new Error(`OT track must have exactly 365 chunks, got ${otChunks.length}`);
  }
  const track2 = buildTrack2();

  const plan = [];
  for (let day = 1; day <= 365; day++) {
    const ot = otChunks[day - 1];
    const second = track2[day - 1];
    plan.push({
      day,
      passages: [
        { reference: ot.reference, apiQueries: ot.apiQueries, track: ot.track },
        { reference: second.reference, apiQueries: second.apiQueries, track: second.track },
      ],
      kidSummary: kidSummaryFor(ot),
    });
  }

  // ---- Validation: every chapter exactly once ----
  const seen = new Map();
  for (const d of plan) {
    for (const p of d.passages) {
      for (const q of p.apiQueries) {
        seen.set(q, (seen.get(q) || 0) + 1);
      }
    }
  }
  const dupes = [...seen.entries()].filter(([, n]) => n > 1);
  if (dupes.length) throw new Error(`Duplicate chapters: ${dupes.slice(0, 5).map(([q]) => q)}`);
  if (seen.size !== 1189) throw new Error(`Expected 1189 chapters, got ${seen.size}`);

  const outPath = path.join(__dirname, '..', 'content', 'reading-plan.json');
  fs.writeFileSync(outPath, JSON.stringify(plan, null, 1));
  console.log(`✔ Wrote ${plan.length} days (${seen.size} chapters) to ${outPath}`);
}

main();
