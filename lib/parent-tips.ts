/**
 * Static lead tips for parents on each screen type.
 */
import en from '@/locales/en.json';
import es from '@/locales/es.json';

import { getLocale } from '@/i18n/index';

export type ParentTipScreen = 'reading' | 'devotional' | 'prayer' | 'memory-verse';

type TipsDict = {
  parentTips: {
    reading: string[];
    devotional: string[];
    prayer: string[];
    memoryVerse: string[];
  };
};

const LOCALES: Record<'en' | 'es', TipsDict> = { en: en as TipsDict, es: es as TipsDict };

function screenKey(screen: ParentTipScreen): keyof TipsDict['parentTips'] {
  return screen === 'memory-verse' ? 'memoryVerse' : screen;
}

export function getParentTips(screen: ParentTipScreen): string[] {
  const locale = getLocale();
  const tips = LOCALES[locale]?.parentTips[screenKey(screen)] ?? [];
  if (tips.length > 0) return tips;
  return LOCALES.en.parentTips[screenKey(screen)] ?? [];
}

/** One tip for the screen, stable for a given day. */
export function parentTipFor(screen: ParentTipScreen, day: number): string {
  const tips = getParentTips(screen);
  if (tips.length === 0) return '';
  return tips[day % tips.length];
}

/** @deprecated Use getParentTips(screen) */
export const PARENT_TIPS: Record<ParentTipScreen, string[]> = {
  reading: LOCALES.en.parentTips.reading,
  devotional: LOCALES.en.parentTips.devotional,
  prayer: LOCALES.en.parentTips.prayer,
  'memory-verse': LOCALES.en.parentTips.memoryVerse,
};
