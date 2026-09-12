/**
 * Static lead tips for parents on each screen type.
 */
export type ParentTipScreen = 'reading' | 'devotional' | 'prayer' | 'memory-verse';

export const PARENT_TIPS: Record<ParentTipScreen, string[]> = {
  reading: [
    'Pause after the kid recap and ask, "What do you think happens next?"',
    'Let younger kids draw while you read — listening counts.',
    'Pick one verse to wonder about together instead of rushing through.',
  ],
  devotional: [
    'Reveal one question at a time; silence is okay while kids think.',
    'Share your own honest answer first — it invites theirs.',
    'If energy is low, pick one question and save the rest for tomorrow.',
  ],
  prayer: [
    'Invite each person to add one word in the fill-in-the-blank lines.',
    'Pray slowly enough that kids can repeat the closing line with you.',
    'Name one thing from today you are thankful for before you say amen.',
  ],
  'memory-verse': [
    'Say the verse once, then let kids fill in missing words.',
    'Make up simple motions for key words — bodies remember too.',
    'Practice at the same time each week so it becomes a family habit.',
  ],
};

/** One tip for the screen, stable for a given day. */
export function parentTipFor(screen: ParentTipScreen, day: number): string {
  const tips = PARENT_TIPS[screen];
  return tips[day % tips.length];
}
