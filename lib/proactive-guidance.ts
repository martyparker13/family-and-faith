/**
 * Map reading / devotional themes to Scripture Guidance topic IDs.
 */
import { getDevotional, getPlanDay } from '@/lib/content';
import { guidanceTopics } from '@/lib/content';

/** Theme and keyword → guidance topic id. */
const THEME_TO_TOPIC: Record<string, string> = {
  faith: 'trusting-gods-plan',
  trust: 'trusting-gods-plan',
  fear: 'anxiety-worry',
  anxiety: 'anxiety-worry',
  worry: 'anxiety-worry',
  anger: 'controlling-anger',
  forgiveness: 'forgiving-others',
  kindness: 'gentle-words',
  love: 'marriage-renewal',
  patience: 'patience-with-family',
  obedience: 'teaching-obedience',
  gratitude: 'thankfulness',
  thankfulness: 'thankfulness',
  prayer: 'praying-for-children',
  wisdom: 'parenting-wisdom',
  parenting: 'parenting-wisdom',
  sibling: 'sibling-fighting',
  fighting: 'sibling-fighting',
  death: 'explaining-death-to-kids',
  grief: 'losing-loved-one',
  loss: 'losing-loved-one',
  money: 'financial-anxiety',
  generosity: 'generosity-giving',
  honesty: 'integrity',
  courage: 'growing-faith',
  humility: 'gentle-words',
  pride: 'gentle-words',
  peace: 'sleep-and-peace',
  conflict: 'resolving-conflict',
  marriage: 'marriage-struggles',
  spouse: 'marriage-communication',
  work: 'burnout',
  rest: 'sabbath-rest',
  discipline: 'gentle-discipline',
  boundaries: 'gentle-discipline',
  hope: 'joy-in-hard-times',
  suffering: 'joy-in-hard-times',
  hard: 'joy-in-hard-times',
};

const topicById = new Map(guidanceTopics.map((t) => [t.id, t]));

function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

function matchFromText(text: string): string | null {
  const lower = text.toLowerCase();
  for (const [keyword, topicId] of Object.entries(THEME_TO_TOPIC)) {
    if (lower.includes(keyword)) return topicId;
  }
  for (const token of tokens(text)) {
    const hit = THEME_TO_TOPIC[token];
    if (hit) return hit;
  }
  return null;
}

export interface ProactiveGuidanceMatch {
  topicId: string;
  topicName: string;
  reason: string;
}

/** Related guidance for a plan day (devotional theme + reading references). */
export function proactiveGuidanceForDay(day: number): ProactiveGuidanceMatch | null {
  const devotional = getDevotional(day);
  const plan = getPlanDay(day);
  const refs = plan.passages.map((p) => p.reference).join(' ');

  const topicId =
    matchFromText(devotional.theme) ??
    matchFromText(devotional.title) ??
    matchFromText(devotional.reflection.slice(0, 200)) ??
    matchFromText(refs);

  if (!topicId) return null;
  const topic = topicById.get(topicId);
  if (!topic) return null;

  return {
    topicId,
    topicName: topic.name,
    reason: `Today's theme: ${devotional.theme}`,
  };
}
