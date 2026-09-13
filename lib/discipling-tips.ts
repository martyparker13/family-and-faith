/**
 * First-time discipling tips — days 1–14 since plan start.
 */
export interface DisciplingTip {
  id: string;
  day: number;
  title: string;
  body: string;
}

export const DISCIPLING_TIPS: DisciplingTip[] = [
  {
    id: 'tip-1',
    day: 1,
    title: 'Start small',
    body: 'Five minutes counts. Read one paragraph, ask one question, say one prayer — then celebrate showing up.',
  },
  {
    id: 'tip-2',
    day: 2,
    title: 'Ask before you explain',
    body: 'Try "What did you notice?" before teaching. Kids often see things adults miss.',
  },
  {
    id: 'tip-3',
    day: 3,
    title: 'Pray out loud',
    body: 'Model simple prayers: "God, thank you for…" Kids learn by hearing you talk to God like a friend.',
  },
  {
    id: 'tip-4',
    day: 4,
    title: 'Silly is okay',
    body: 'Wiggly bodies and goofy voices still count as worship. Meet kids where they are.',
  },
  {
    id: 'tip-5',
    day: 5,
    title: 'One question at a time',
    body: 'Reveal devotional questions one by one. Silence while they think is a gift, not awkward.',
  },
  {
    id: 'tip-6',
    day: 6,
    title: 'Missed a day?',
    body: 'Grace, not guilt. Pick up today — God is not keeping score like a report card.',
  },
  {
    id: 'tip-7',
    day: 7,
    title: 'Let kids lead',
    body: 'Ask a child to read the kid recap or pray the closing line. Ownership builds habit.',
  },
  {
    id: 'tip-8',
    day: 8,
    title: 'Connect to real life',
    body: 'Link the story to something from today: school, siblings, a worry. Scripture lives in ordinary moments.',
  },
  {
    id: 'tip-9',
    day: 9,
    title: 'Bedtime counts',
    body: 'If morning reading did not happen, the bedtime prayer still anchors the day in God.',
  },
  {
    id: 'tip-10',
    day: 10,
    title: 'Repeat the big idea',
    body: 'End with one sentence: "Today we learned God…" Repetition helps little hearts remember.',
  },
  {
    id: 'tip-11',
    day: 11,
    title: 'Invite honesty',
    body: 'It is okay to say "That is a hard part of the Bible." Wonder together; you do not need every answer.',
  },
  {
    id: 'tip-12',
    day: 12,
    title: 'Use the journal',
    body: 'One line after dinner — a quote, a laugh, a prayer. You are building a keepsake without extra work.',
  },
  {
    id: 'tip-13',
    day: 13,
    title: 'Stack the rhythm',
    body: 'Morning reading, dinner talk, bedtime prayer — three small anchors beat one long session.',
  },
  {
    id: 'tip-14',
    day: 14,
    title: 'You are the right parent',
    body: 'God chose your family for this journey. Keep showing up — that is discipleship.',
  },
];

/** Tip for calendar day since plan start (1–14), or null after day 14. */
export function disciplingTipForPlanDay(planDaySinceStart: number): DisciplingTip | null {
  if (planDaySinceStart < 1 || planDaySinceStart > 14) return null;
  return DISCIPLING_TIPS.find((t) => t.day === planDaySinceStart) ?? null;
}
