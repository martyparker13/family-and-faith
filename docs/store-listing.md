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

**Subtitle** (max 30 chars — this one is 29):

> Morning, dinner & bedtime rhythm

**Promotional text** (max 170 chars — editable anytime without review; 168):

> Three daily moments — morning reading, dinner talk, bedtime prayer. A
> gentle rhythm that helps parents lead, not just read aloud. Start any day.

**Keywords** (max 100 chars, comma-separated, no spaces — 98):

> bible,family,devotional,kids,prayer,christian,faith,scripture,daily,rhythm,bedtime,parent

**Description:**

Faith & Family helps your whole family grow closer to God through a simple
daily rhythm — morning reading, dinner talk, and bedtime prayer.

YOUR DAILY RHYTHM
Three reminders, three moments, one year through the whole Bible. The Today
screen shows what's up next based on time of day. Guided flows walk parents
through each slot — reading + memory verse in the morning, conversation at
dinner, prayer at bedtime. Per-slot streaks celebrate showing up, not
checkbox anxiety.

ONE YEAR THROUGH THE WHOLE BIBLE
A family-paced reading plan covers every chapter of the Bible in 365 days.
Each day pairs a manageable Old Testament portion with the New Testament or
Psalms. Teaching points, a story timeline, and a shorter "bedtime version"
help kids grasp one takeaway per day.

PARENT-AS-LEADER TOOLS
Child age profiles auto-match discussion questions. A collapsible parent prep
card gives tonight's big idea, a lead-in script, and which questions to use.
Weekly recap on Sundays summarizes readings, themes, journal entries, and
answered prayers.

DAILY DEVOTIONALS BUILT FOR CONVERSATION
365 warm devotionals with tiered questions revealed one card at a time.
Family challenges you can mark complete together. 35 rotating themes so content
stays fresh all year.

PRAYERS, GUIDANCE, JOURNAL & MORE
• Fill-in-the-blank family prayers · Prayer list with answered history
• Scripture Guidance — 60+ topics for real-life struggles
• Memory verse practice with tap-to-reveal words
• Family journal becomes a year-end keepsake export
• Advent seasonal overlay · Catch-up mode when life gets messy
• Import/export backup JSON for a second device

MADE FOR FAMILIES
• Read-aloud narration · Offline reading · Light & dark mode
• No accounts · No ads · No tracking · Private by design

Scripture quotations are from the World English Bible (public domain).

---

## Google Play

**Short description** (max 80 chars — this one is 79):

> Morning reading, dinner talk, bedtime prayer — disciple kids through daily rhythm.

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
| iPhone screenshots | 6.9" and 6.5", 3–10 each | 📸 capture Today rhythm hero |
| iPad screenshots | 13", needed because `supportsTablet` is true | 📸 |
| Play phone screenshots | min 2, ≥1080px | 📸 |
| Play feature graphic | 1024×500 PNG/JPG | 🎨 |
| Play app icon | 512×512 | export from icon.png |

Screenshot tip: capture the Today screen with the "Up next" hero, three
rhythm streak indicators, parent prep card, guided flow, memory verse
practice, and Advent overlay (in December).
