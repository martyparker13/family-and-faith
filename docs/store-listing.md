# Store Listing Copy — Faith & Family

Everything below is ready to paste into App Store Connect and Google Play
Console. Character limits are noted where the stores enforce them.

---

## Shared

**App name:** Faith & Family
**Category:** Lifestyle (primary) · Reference (secondary, iOS only)
**Privacy policy URL:** host `docs/privacy.html` and paste its URL
(GitHub Pages: repo Settings → Pages → deploy from `/docs` folder, then the
URL is `https://<username>.github.io/<repo>/privacy.html`)

---

## Apple App Store

**Subtitle** (max 30 chars — this one is 28):

> Bible, devotions and prayer

**Promotional text** (max 170 chars — editable anytime without review; 161):

> Start any day of the year — Day 1 begins when your family does. Read,
> talk, and pray together with readings, devotionals, and prayers for kids
> and parents.

**Keywords** (max 100 chars, comma-separated, no spaces — 97):

> bible,family,devotional,kids,prayer,christian,faith,scripture,daily,children,verse,study,worship

**Description:**

Faith & Family helps your whole family grow closer to God together — around
the dinner table, at bedtime, or on the couch on a Saturday morning.

ONE YEAR THROUGH THE WHOLE BIBLE
A family-paced reading plan covers every chapter of the Bible in 365 days.
Each day pairs a manageable Old Testament portion with the New Testament or
Psalms — no long slogs. Every day opens with a "For Kids" recap in simple
language ("Today we read about Noah building a giant boat!") so even the
youngest reader knows what's happening. Start any day of the year: Day 1 is
whenever your family begins.

DAILY DEVOTIONALS BUILT FOR CONVERSATION
365 warm, kid-friendly devotionals, each anchored to scripture, with
discussion questions tiered for little ones and for older kids & parents —
revealed one card at a time, the way real family conversations work. Each
day ends with a simple Family Challenge.

PRAYERS YOUR WHOLE FAMILY CAN PRAY
365 daily prayers written to be read aloud together, with fill-in-the-blank
moments so every family member gets a voice, and a closing line you repeat
together. Keep a family prayer list, and move requests to a growing
"Answered Prayers" history kids can look back on — faith they can see.

SCRIPTURE FOR REAL LIFE
Type what your family is facing — "my kids keep fighting," "anxiety about
finances," "grief after losing a grandparent" — and find curated Bible
passages with a short pastoral note. More than 60 topics across parenting,
marriage, fear, grief, money, friendship, and more. Save verses and prayers
to Favorites.

MADE FOR FAMILIES
• Streak flame and joyful celebrations for days completed together
• Read-aloud narration that highlights each verse as it reads
• A family journal — one line a day becomes a yearly keepsake
• Memory verse of the week
• Adjustable text size, light & dark mode, gentle daily reminder
• Works offline — download weeks of reading ahead of time

PRIVATE BY DESIGN
No accounts. No ads. No tracking. Everything stays on your device.

Scripture quotations are from the World English Bible (public domain).

---

## Google Play

**Short description** (max 80 chars — this one is 78):

> Read the Bible in a year as a family — daily devotionals, prayers & guidance.

**Full description:** use the Apple description above (Play allows 4,000
characters; it fits).

---

## Review questionnaires — suggested answers

**Apple privacy "nutrition label":** Data Not Collected. (The only network
traffic is fetching public-domain Bible text from bible-api.com; no
identifiers are sent.)

**Apple age rating:** answer "none" to all sensitive-content questions →
rates 4+. Do NOT opt into the Kids Category — the app is parent-directed.

**Play content rating (IARC):** no violence/sex/drugs/gambling, no user
interaction features, no data sharing → rates Everyone.

**Play target audience:** 13+ / parents. Decline "Designed for Families"
program — same reasoning as iOS: the app is used by families but directed
at the parent account holder.

**Play Data safety form:** No data collected, no data shared. App encrypts
no data in transit on our servers (we have none).

---

## Asset checklist

| Asset | Spec | Status |
| --- | --- | --- |
| App icon | generated (`assets/images/icon.png`) | ✅ done |
| iPhone screenshots | 6.9" (1320×2868) and 6.5" (1284×2778), 3–10 each | 📸 take in Simulator |
| iPad screenshots | 13" (2064×2752), needed because `supportsTablet` is true | 📸 take in Simulator |
| Play phone screenshots | min 2, 16:9 or 9:16, ≥1080px | 📸 take on device/emulator |
| Play feature graphic | 1024×500 PNG/JPG | 🎨 to make |
| Play app icon | 512×512 (export from icon.png) | run: `npx sharp-cli resize 512 512 -i assets/images/icon.png -o playstore-icon.png` or ask Claude |

Screenshot tip: the best five screens to capture are Today (with a streak),
the Reading screen (Genesis 1 with the For Kids card), a Devotional with one
question revealed, the Prayer screen in prayer mode, and Guidance search
results for "my kids keep fighting".
