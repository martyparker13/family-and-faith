/**
 * Scripture Guidance topics, batch 1 of 2 (32 of 64 topics).
 * Each topic: id, name, category, keywords (synonyms/natural phrases for
 * fuzzy search), a 2–3 sentence pastoral note, and WEB verse references
 * (text is fetched by generate-guidance.js).
 */
module.exports = [
  // ---------- Parenting ----------
  {
    id: 'parenting-wisdom',
    name: 'Wisdom for Parenting',
    category: 'Parenting',
    keywords: ['how to be a good parent', 'parenting help', 'raising kids', 'raising children', 'mom', 'dad', 'wisdom as a mother', 'wisdom as a father', 'parenting decisions', 'overwhelmed parent', 'am I a good parent'],
    note: 'No parent feels fully qualified — and God knows that. He promises wisdom generously to anyone who asks, and He entrusted your children to you on purpose. Parent from His strength, not your own perfection.',
    verseRefs: ['James 1:5', 'Proverbs 22:6', 'Deuteronomy 6:6-7', 'Psalm 127:3', 'Isaiah 40:11', 'Philippians 1:6'],
  },
  {
    id: 'sibling-fighting',
    name: 'When Kids Keep Fighting',
    category: 'Parenting',
    keywords: ['my kids keep fighting', 'siblings fighting', 'sibling rivalry', 'brothers fighting', 'sisters arguing', 'kids bickering', 'children quarreling', 'fighting over toys', 'jealousy between kids', 'peace at home'],
    note: 'Sibling conflict is one of the oldest stories in the Bible — and one of the best classrooms for grace. These verses help children (and parents) practice peacemaking, patience, and quick forgiveness. Unity at home is something God delights to build, one small reconciliation at a time.',
    verseRefs: ['Psalm 133:1', 'Ephesians 4:32', 'Proverbs 15:1', 'Romans 12:18', 'Colossians 3:13', 'Matthew 5:9'],
  },
  {
    id: 'gentle-discipline',
    name: 'Disciplining with Patience',
    category: 'Parenting',
    keywords: ['disciplining with patience', 'discipline children', 'correcting kids', 'losing my temper with kids', 'yelling at my kids', 'gentle parenting', 'consequences', 'training children', 'strong willed child', 'toddler tantrums'],
    note: 'God disciplines the children He loves — patiently, purposefully, and never in rage. These passages model correction that trains rather than crushes, and they offer grace for the parent who is still learning self-control too.',
    verseRefs: ['Proverbs 29:17', 'Ephesians 6:4', 'Hebrews 12:11', 'James 1:19-20', 'Proverbs 15:1', 'Colossians 3:21'],
  },
  {
    id: 'praying-for-children',
    name: 'Praying for Your Children',
    category: 'Parenting',
    keywords: ['praying for my kids', 'pray for my child', 'children walking with God', 'child faith', 'worried about my child', 'child future', 'bless my children', 'kids know Jesus', 'child salvation'],
    note: 'The most powerful parenting happens on your knees. God hears every prayer you pray over your children, and He loves them even more than you do. These verses are promises to pray back to Him, by name, for each child.',
    verseRefs: ['Isaiah 54:13', '3 John 1:4', 'Philippians 1:6', 'Proverbs 22:6', '2 Timothy 1:5', 'Luke 18:16'],
  },

  // ---------- Marriage ----------
  {
    id: 'marriage-struggles',
    name: 'Struggling in Marriage',
    category: 'Marriage',
    keywords: ['struggling in our marriage', 'marriage problems', 'marriage is hard', 'distant from my spouse', 'husband', 'wife', 'marriage falling apart', 'save my marriage', 'marriage counseling', 'feeling unloved by spouse'],
    note: 'Every marriage walks through hard seasons, and God does not waste them. He is the third strand in the cord — able to soften hearts, rebuild trust, and renew love that feels worn thin. Keep turning toward each other, and keep turning together toward Him.',
    verseRefs: ['Ecclesiastes 4:12', '1 Corinthians 13:4-7', 'Colossians 3:14', '1 Peter 4:8', 'Ephesians 4:2-3', 'Psalm 34:18'],
  },
  {
    id: 'marriage-communication',
    name: 'Communication in Marriage',
    category: 'Marriage',
    keywords: ['we keep arguing', 'spouse doesn\'t listen', 'communication problems', 'arguing with my husband', 'arguing with my wife', 'harsh words at home', 'misunderstandings', 'talking past each other', 'criticism in marriage'],
    note: 'Most marriage wounds are word-shaped — and so is much of the healing. Scripture coaches us to listen first, soften our answers, and speak words that build. Small changes in tone can change the temperature of a whole home.',
    verseRefs: ['James 1:19', 'Proverbs 15:1', 'Ephesians 4:29', 'Proverbs 16:24', 'Colossians 4:6', 'Proverbs 18:13'],
  },
  {
    id: 'marriage-forgiveness',
    name: 'Forgiveness in Marriage',
    category: 'Marriage',
    keywords: ['forgiving my spouse', 'hurt by my husband', 'hurt by my wife', 'betrayed by spouse', 'resentment in marriage', 'keeping score', 'old wounds in marriage', 'starting over in marriage'],
    note: 'Two imperfect people under one roof will need oceans of forgiveness — and God supplies it. He forgave us completely, which becomes both our model and our power source. Forgiveness in marriage is rarely one decision; it is a daily direction.',
    verseRefs: ['Colossians 3:13', '1 Peter 4:8', 'Ephesians 4:31-32', 'Matthew 6:14', '1 Corinthians 13:4-7', 'Lamentations 3:22-23'],
  },
  {
    id: 'marriage-renewal',
    name: 'Rekindling Love',
    category: 'Marriage',
    keywords: ['fell out of love', 'rekindle romance', 'marriage feels stale', 'roommates not spouses', 'renew our marriage', 'date my spouse', 'love grown cold', 'strengthen our marriage'],
    note: 'Love in Scripture is less a feeling that finds us than a practice that forms us — patient, kind, persevering. As you serve, honor, and delight in one another again, feelings often follow faithfulness. God loves to renew what time has worn.',
    verseRefs: ['Song of Solomon 8:7', '1 Corinthians 13:4-7', 'Romans 12:10', 'Ecclesiastes 4:9-10', 'Philippians 2:3-4', '1 John 4:19'],
  },

  // ---------- Conflict & Forgiveness ----------
  {
    id: 'forgiving-others',
    name: 'Forgiving Someone Who Hurt You',
    category: 'Conflict & Forgiveness',
    keywords: ['how to forgive', 'someone hurt me', 'can\'t forgive', 'letting go of hurt', 'they never apologized', 'deep wound', 'betrayal by a friend', 'forgive and forget', 'moving past hurt'],
    note: 'Forgiveness does not excuse the wrong or erase the wound — it releases the debt into God\'s hands, where justice and mercy both live. It is often slow, and that is okay. God forgave us everything, and He will help you forgive this.',
    verseRefs: ['Colossians 3:13', 'Matthew 6:14', 'Ephesians 4:31-32', 'Romans 12:19', 'Psalm 103:12', 'Luke 23:34'],
  },
  {
    id: 'seeking-forgiveness',
    name: 'When You Need to Apologize',
    category: 'Conflict & Forgiveness',
    keywords: ['I hurt someone', 'how to apologize', 'saying sorry', 'making amends', 'guilty conscience', 'I was wrong', 'ask for forgiveness', 'repairing a relationship', 'owning my mistake'],
    note: 'A real apology is one of the bravest and most healing acts a person can offer. Scripture urges us to make things right quickly and humbly — with people and with God, who forgives fully the moment we confess.',
    verseRefs: ['Matthew 5:23-24', '1 John 1:9', 'James 5:16', 'Proverbs 28:13', 'Psalm 51:10', 'Luke 19:8'],
  },
  {
    id: 'resolving-conflict',
    name: 'Resolving a Conflict',
    category: 'Conflict & Forgiveness',
    keywords: ['conflict with family member', 'argument with a friend', 'family feud', 'not speaking to each other', 'disagreement', 'tension with someone', 'how to make peace', 'mediating a fight', 'restore a relationship'],
    note: 'Peacemaking is family business in God\'s house — Jesus called peacemakers His Father\'s children. These verses give a path: go directly, speak gently, listen fully, and pursue peace as far as it depends on you. Some conflicts take time; keep your side of the bridge open.',
    verseRefs: ['Matthew 5:9', 'Romans 12:18', 'Proverbs 15:1', 'Matthew 18:15', 'James 3:17-18', 'Proverbs 17:14'],
  },
  {
    id: 'holding-grudges',
    name: 'Letting Go of Bitterness',
    category: 'Conflict & Forgiveness',
    keywords: ['holding a grudge', 'bitterness', 'resentment', 'can\'t let it go', 'replaying the hurt', 'angry at someone for years', 'poisoned by anger', 'heart feels hard'],
    note: 'Bitterness promises protection but quietly poisons the one who carries it. God invites you to hand Him the record of wrongs and let His kindness soften what has gone hard. Letting go is not weakness — it is freedom.',
    verseRefs: ['Hebrews 12:15', 'Ephesians 4:31-32', 'Proverbs 17:9', 'Psalm 37:8', '1 Peter 5:7', 'Philippians 4:8'],
  },

  // ---------- Fear & Anxiety ----------
  {
    id: 'anxiety-worry',
    name: 'Anxiety & Worry',
    category: 'Fear & Anxiety',
    keywords: ['anxiety', 'anxious', 'worry', 'worrying all the time', 'can\'t stop worrying', 'stressed', 'overthinking', 'what if thoughts', 'nervous', 'panic', 'racing thoughts'],
    note: 'God does not scold the anxious heart — He invites it closer. Cast every care on Him, piece by piece, and let His peace stand guard where worry used to pace. You were never meant to carry tomorrow today.',
    verseRefs: ['Philippians 4:6-7', '1 Peter 5:7', 'Matthew 6:34', 'Psalm 55:22', 'Isaiah 41:10', 'John 14:27'],
  },
  {
    id: 'fear-of-future',
    name: 'Fear of the Future',
    category: 'Fear & Anxiety',
    keywords: ['afraid of the future', 'uncertainty', 'what will happen', 'unknown future', 'big decision ahead', 'scared of change', 'future plans', 'worried about tomorrow', 'nothing feels certain'],
    note: 'The future is unknown to you, but it is not unknown to God — and He is already there. His plans for His people are good, and His presence goes ahead of every step. You can walk into tomorrow holding the hand of the One who holds it.',
    verseRefs: ['Jeremiah 29:11', 'Proverbs 3:5-6', 'Matthew 6:34', 'Deuteronomy 31:8', 'Psalm 23:4', 'Romans 8:28'],
  },
  {
    id: 'childs-fears',
    name: "Calming a Child's Fears",
    category: 'Fear & Anxiety',
    keywords: ['my child is scared', 'nightmares', 'afraid of the dark', 'kid anxiety', 'scared at bedtime', 'separation anxiety', 'child won\'t sleep', 'monsters', 'comforting a scared child', 'first day jitters'],
    note: 'Children\'s fears are real to them, and God takes them seriously — His "do not be afraid" is spoken tenderly, not impatiently. These verses are short enough for little ones to memorize and hold onto in the dark. Pray them together at bedtime.',
    verseRefs: ['Psalm 56:3', 'Isaiah 41:10', 'Psalm 4:8', 'Joshua 1:9', 'Psalm 121:3-4', '2 Timothy 1:7'],
  },
  {
    id: 'overwhelmed',
    name: 'Feeling Overwhelmed',
    category: 'Fear & Anxiety',
    keywords: ['overwhelmed', 'too much on my plate', 'drowning in responsibilities', 'can\'t cope', 'everything at once', 'falling apart', 'burned out and anxious', 'heavy load', 'at my limit'],
    note: 'When the waters rise, God does not hand you a lecture — He hands you Himself. He is a refuge, a rock higher than the flood, and a shepherd who restores. Come to Him with the whole pile; He sorts what you cannot.',
    verseRefs: ['Psalm 61:2', 'Matthew 11:28-30', 'Psalm 46:1', 'Isaiah 43:2', 'Psalm 23:1-3', '2 Corinthians 12:9'],
  },

  // ---------- Grief & Loss ----------
  {
    id: 'losing-loved-one',
    name: 'Losing Someone You Love',
    category: 'Grief & Loss',
    keywords: ['grief', 'death of a loved one', 'lost my mom', 'lost my dad', 'funeral', 'mourning', 'heartbroken', 'they passed away', 'missing someone who died', 'bereavement'],
    note: 'Grief is love with nowhere to go, and God does not rush it — He stays close to the brokenhearted and keeps count of every tear. For those who hope in Christ, death is a comma, not a period. Sorrow is real; so is the reunion ahead.',
    verseRefs: ['Psalm 34:18', 'Matthew 5:4', 'Revelation 21:4', '1 Thessalonians 4:13-14', 'Psalm 73:26', 'John 14:1-3'],
  },
  {
    id: 'grieving-grandparent',
    name: 'Grief After Losing a Grandparent',
    category: 'Grief & Loss',
    keywords: ['grief after losing a grandparent', 'grandma died', 'grandpa died', 'grandmother passed away', 'grandfather passed', 'kids lost their grandparent', 'explaining grandma\'s death'],
    note: 'A grandparent\'s love leaves a deep, warm imprint — and a deep ache when they go. Let the family grieve together, tell their stories, and lean on the God who numbers our days and keeps His people forever. Their faithfulness can keep bearing fruit for generations.',
    verseRefs: ['Psalm 116:15', 'Psalm 90:12', '2 Timothy 1:5', 'Revelation 21:4', 'Psalm 34:18', 'Proverbs 13:22'],
  },
  {
    id: 'explaining-death-to-kids',
    name: 'Helping Kids Understand Death',
    category: 'Grief & Loss',
    keywords: ['explaining death to children', 'child grief', 'kid asking about death', 'what happens when we die', 'child lost a friend', 'talking to kids about heaven', 'children and funerals'],
    note: 'Children need simple, honest words and a safe lap for their questions. Scripture gives both: Jesus wept at a grave, so tears are allowed — and He rose, so hope is honest too. Answer what they ask, comfort what they feel, and point gently to heaven.',
    verseRefs: ['John 11:35', 'John 11:25', 'Psalm 34:18', 'Revelation 21:4', 'Psalm 147:3', 'Matthew 19:14'],
  },
  {
    id: 'loss-of-pet',
    name: 'Losing a Family Pet',
    category: 'Grief & Loss',
    keywords: ['pet died', 'dog died', 'cat died', 'putting pet down', 'child grieving pet', 'goodbye to a pet', 'pet loss'],
    note: 'For a child, losing a pet is often their first real grief — treat it gently, not lightly. The God who made every creature and feeds every sparrow shares your family\'s tenderness toward what He made. It is good to thank Him together for the joy that pet brought.',
    verseRefs: ['Psalm 145:9', 'Matthew 10:29', 'Genesis 1:25', 'Psalm 34:18', 'Psalm 50:10-11', '1 Thessalonians 5:18'],
  },

  // ---------- Anger & Patience ----------
  {
    id: 'controlling-anger',
    name: 'Controlling Your Anger',
    category: 'Anger & Patience',
    keywords: ['anger', 'temper', 'losing my temper', 'rage', 'blowing up', 'yelling', 'short fuse', 'anger management', 'snapping at people', 'explosive anger'],
    note: 'Anger itself is a signal, not always a sin — but unguided, it burns what we love. God offers a better way: slow it down, pray it out, and let His Spirit grow self-control where the fuse used to be. A gentle answer really does turn away wrath.',
    verseRefs: ['James 1:19-20', 'Proverbs 15:1', 'Ephesians 4:26', 'Proverbs 16:32', 'Psalm 37:8', 'Galatians 5:22-23'],
  },
  {
    id: 'patience-with-family',
    name: 'Patience with Your Family',
    category: 'Anger & Patience',
    keywords: ['losing patience with my kids', 'impatient at home', 'irritated with family', 'snapping at my children', 'annoyed with spouse', 'no patience left', 'frazzled parent', 'kids pushing my buttons'],
    note: 'The people we love most see our patience at its thinnest — and home is exactly where God wants to grow it thickest. His patience with you is the deep well to draw from when yours runs dry. Grace received becomes grace passed on.',
    verseRefs: ['Colossians 3:12-13', 'Ephesians 4:2', '1 Corinthians 13:4', 'Proverbs 14:29', 'Galatians 6:9', 'Psalm 103:8'],
  },
  {
    id: 'child-anger',
    name: "Helping an Angry Child",
    category: 'Anger & Patience',
    keywords: ['my child has tantrums', 'angry kid', 'child hits when mad', 'meltdowns', 'teaching kids about anger', 'big feelings', 'child can\'t calm down', 'emotional regulation for kids'],
    note: 'Big feelings in little bodies need coaching, not just correction. These verses give children simple handles — be slow to get angry, use soft words, tell God about it — and give parents the patience to teach them a hundred times. God is gentle with us while we learn; we can be gentle while they do.',
    verseRefs: ['James 1:19', 'Proverbs 15:1', 'Ephesians 4:26', 'Psalm 4:4', 'Proverbs 25:28', 'Philippians 4:6-7'],
  },
  {
    id: 'gentle-words',
    name: 'Taming Your Tongue',
    category: 'Anger & Patience',
    keywords: ['harsh words', 'said something I regret', 'words that hurt', 'gossip', 'criticism', 'sarcasm', 'speaking kindly', 'watch my mouth', 'words have power', 'complaining'],
    note: 'Words can wound deeper than wounds and heal deeper than medicine — Scripture takes them that seriously. Ask God to set a guard over your mouth and to fill your home with words that give grace. The tongue is tamed one sentence at a time.',
    verseRefs: ['Psalm 141:3', 'Ephesians 4:29', 'Proverbs 16:24', 'Proverbs 18:21', 'Colossians 4:6', 'James 3:9-10'],
  },

  // ---------- Money & Provision ----------
  {
    id: 'financial-anxiety',
    name: 'Anxiety About Finances',
    category: 'Money & Provision',
    keywords: ['anxiety about finances', 'money worries', 'bills', 'debt', 'can\'t pay rent', 'financial stress', 'paycheck to paycheck', 'money problems', 'afford', 'tight budget', 'providing for my family'],
    note: 'Jesus spoke directly to money worry: your Father knows what you need, feeds the birds, and clothes the flowers — and you matter far more. Bring the numbers to Him honestly, take wise next steps, and watch for daily bread. He has a long record of providing.',
    verseRefs: ['Matthew 6:31-33', 'Philippians 4:19', 'Matthew 6:26', 'Psalm 37:25', 'Hebrews 13:5', 'Proverbs 3:9-10'],
  },
  {
    id: 'contentment',
    name: 'Contentment with What You Have',
    category: 'Money & Provision',
    keywords: ['contentment', 'always wanting more', 'comparing to others', 'envy', 'jealous of what others have', 'keeping up', 'materialism', 'never enough', 'gratitude for what we have', 'kids want everything'],
    note: 'Contentment is not having everything you want — it is wanting what you already have, because God Himself is in it. Paul called it a secret he learned, which means it can be learned at your house too. Gratitude is the daily practice that gets you there.',
    verseRefs: ['Philippians 4:11-13', '1 Timothy 6:6-8', 'Hebrews 13:5', 'Psalm 23:1', 'Ecclesiastes 5:10', 'Matthew 6:19-21'],
  },
  {
    id: 'generosity-giving',
    name: 'Generosity & Giving',
    category: 'Money & Provision',
    keywords: ['giving', 'tithing', 'generosity', 'how much to give', 'teaching kids to give', 'donating', 'helping the poor', 'open handed', 'cheerful giver', 'sharing what we have'],
    note: 'Giving is the family habit that most resembles God, who gave first and gave best. Scripture promises that generous people are enriched in every way that matters. Let your children watch you give gladly — it is a sermon they will never forget.',
    verseRefs: ['2 Corinthians 9:7', 'Acts 20:35', 'Proverbs 11:25', 'Luke 6:38', 'Proverbs 19:17', 'Malachi 3:10'],
  },
  {
    id: 'job-loss',
    name: 'Job Loss & Providing',
    category: 'Money & Provision',
    keywords: ['lost my job', 'unemployed', 'laid off', 'job hunting', 'career uncertainty', 'how will we make it', 'breadwinner', 'work dried up', 'new job search', 'provider stress'],
    note: 'A lost job shakes more than a budget — it shakes identity and security. But your worth was never your paycheck, and your provider was never really the company. God who fed Israel in a wilderness can sustain your family through this in-between.',
    verseRefs: ['Philippians 4:19', 'Psalm 37:25', 'Matthew 6:31-33', 'Isaiah 41:10', 'Jeremiah 29:11', 'Psalm 121:1-2'],
  },

  // ---------- Health & Healing ----------
  {
    id: 'illness-in-family',
    name: 'When a Loved One Is Sick',
    category: 'Health & Healing',
    keywords: ['family member sick', 'sick child', 'hospital', 'diagnosis', 'illness in the family', 'caring for sick parent', 'waiting for test results', 'surgery', 'praying for someone sick'],
    note: 'Few things feel as helpless as watching someone you love suffer. But prayer is not nothing — it is the most powerful thing, reaching the Healer Himself. Bring your fear, keep showing up with love, and trust Him with what medicine cannot reach.',
    verseRefs: ['James 5:14-15', 'Psalm 103:2-3', 'Jeremiah 17:14', 'Psalm 41:3', 'Matthew 8:16-17', 'Psalm 46:1'],
  },
  {
    id: 'chronic-illness',
    name: 'Living with Ongoing Illness',
    category: 'Health & Healing',
    keywords: ['chronic illness', 'chronic pain', 'long term sickness', 'disability', 'why won\'t God heal me', 'tired of being sick', 'living with pain', 'invisible illness', 'health keeps failing'],
    note: 'When healing is slow or does not come, God has not looked away. His grace is sufficient for each day, His strength shows up best in weakness, and these light-and-momentary years are not the whole story. You are seen, sustained, and never alone in this.',
    verseRefs: ['2 Corinthians 12:9', 'Psalm 73:26', '2 Corinthians 4:16-17', 'Isaiah 40:29-31', 'Psalm 34:18', 'Romans 8:18'],
  },
  {
    id: 'praying-for-healing',
    name: 'Praying for Healing',
    category: 'Health & Healing',
    keywords: ['healing prayer', 'pray for healing', 'God heal me', 'recovery', 'get well', 'healing scriptures', 'restore my health', 'miracle healing'],
    note: 'God invites bold, specific prayer for healing — Jesus never turned away a single person who asked. Pray with faith, welcome doctors and medicine as His common grace, and rest in His goodness whatever the timeline. The Lord who heals is also the Lord who holds.',
    verseRefs: ['Jeremiah 17:14', 'James 5:14-15', 'Psalm 30:2', 'Psalm 103:2-3', 'Exodus 15:26', 'Matthew 9:35'],
  },
  {
    id: 'caring-for-caregiver',
    name: 'Strength for Caregivers',
    category: 'Health & Healing',
    keywords: ['caregiver burnout', 'caring for aging parent', 'exhausted from caregiving', 'caring for sick spouse', 'caregiver fatigue', 'no one helps me care', 'sandwich generation'],
    note: 'Caregiving is love poured out daily, often unseen — but God sees every act of it, and He counts it as service to Himself. He carries the carrier: come to Him for rest, ask for help without shame, and let others share the load.',
    verseRefs: ['Matthew 11:28-30', 'Galatians 6:9', 'Isaiah 40:29-31', 'Matthew 25:40', 'Psalm 55:22', '2 Corinthians 9:8'],
  },
];
