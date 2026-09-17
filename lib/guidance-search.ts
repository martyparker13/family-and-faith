/**
 * Fuzzy search over the Scripture Guidance topic index using fuse.js.
 * Searches topic names, keyword/synonym lists, categories, and pastoral
 * notes so natural-language input ("my kids keep fighting") matches well.
 */
import Fuse from 'fuse.js';

import { getGuidanceTopics, type GuidanceTopic } from './content';
import { getLocale } from '@/i18n/index';

const fuseCache = new Map<string, Fuse<GuidanceTopic>>();

function fuseForLocale(locale: string): Fuse<GuidanceTopic> {
  const cached = fuseCache.get(locale);
  if (cached) return cached;
  const fuse = new Fuse(getGuidanceTopics(locale as 'en' | 'es'), {
    includeScore: true,
    ignoreLocation: true,
    threshold: 0.38,
    minMatchCharLength: 2,
    keys: [
      { name: 'name', weight: 0.35 },
      { name: 'keywords', weight: 0.45 },
      { name: 'category', weight: 0.1 },
      { name: 'note', weight: 0.1 },
    ],
  });
  fuseCache.set(locale, fuse);
  return fuse;
}

export interface GuidanceMatch {
  topic: GuidanceTopic;
  /** fuse.js score: lower is better (0 = perfect). */
  score: number;
}

/** Returns the best-matching topics for a natural-language query. */
export function searchGuidance(query: string, limit = 6): GuidanceMatch[] {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];
  const fuse = fuseForLocale(getLocale());
  return fuse
    .search(trimmed, { limit })
    .map((r) => ({ topic: r.item, score: r.score ?? 1 }));
}
