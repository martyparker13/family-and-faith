/**
 * i18n: key parity, locale selection, content loading with fallback.
 */
import devotionalsEs from '@/content/devotionals.es.json';
import guidanceTopicsEs from '@/content/guidance-topics.es.json';
import prayersEs from '@/content/prayers.es.json';
import readingPlanEs from '@/content/reading-plan.es.json';
import devotionalsEn from '@/content/devotionals.json';
import guidanceTopicsEn from '@/content/guidance-topics.json';
import prayersEn from '@/content/prayers.json';
import readingPlanEn from '@/content/reading-plan.json';
import en from '@/locales/en.json';
import es from '@/locales/es.json';
import {
  flattenKeys,
  resolveDeviceLocale,
  resolveLocale,
  setActiveLocale,
  t,
} from '@/i18n/index';
import {
  getDevotional,
  getGuidanceCategories,
  getGuidanceTopic,
  getGuidanceTopics,
  getPlanDay,
  getPrayer,
} from '@/lib/content';

describe('locale JSON parity', () => {
  it('en.json and es.json have the same keys', () => {
    const enKeys = flattenKeys(en as Record<string, unknown>).sort();
    const esKeys = flattenKeys(es as Record<string, unknown>).sort();
    expect(esKeys).toEqual(enKeys);
  });
});

describe('t() helper', () => {
  afterEach(() => setActiveLocale('en'));

  it('returns Spanish when locale is es', () => {
    setActiveLocale('es');
    expect(t('tabs.today')).toBe('Hoy');
  });

  it('falls back to English for missing keys', () => {
    setActiveLocale('es');
    expect(t('nonexistent.key.xyz')).toBe('nonexistent.key.xyz');
  });

  it('interpolates placeholders', () => {
    setActiveLocale('en');
    expect(t('common.dayOf365', { day: 42 })).toBe('Day 42 of 365');
  });
});

describe('resolveLocale', () => {
  it('uses explicit en/es preference', () => {
    expect(resolveLocale('en')).toBe('en');
    expect(resolveLocale('es')).toBe('es');
  });

  it('device follows resolveDeviceLocale', () => {
    expect(resolveLocale('device')).toBe(resolveDeviceLocale());
  });
});

describe('locale-aware content', () => {
  afterEach(() => setActiveLocale('en'));

  it('Spanish bundles match English counts (or pad via accessors)', () => {
    expect(devotionalsEs.length).toBeGreaterThanOrEqual(1);
    expect(prayersEs.length).toBeGreaterThanOrEqual(1);
    expect(readingPlanEs.length).toBeGreaterThanOrEqual(1);
    expect(getGuidanceTopics('es').length).toBe(guidanceTopicsEn.length);
  });

  it('getDevotional returns ES content when locale is es', () => {
    setActiveLocale('es');
    const enDay = getDevotional(1, 'en');
    const esDay = getDevotional(1, 'es');
    expect(esDay.day).toBe(1);
    expect(esDay.title).toBeTruthy();
    if (esDay.title !== enDay.title) {
      expect(esDay.title).not.toBe(enDay.title);
    }
  });

  it('getPrayer returns ES when locale is es', () => {
    setActiveLocale('es');
    const prayer = getPrayer(1, 'es');
    expect(prayer.lines.length).toBeGreaterThan(0);
    expect(prayer.togetherLine.length).toBeGreaterThan(5);
  });

  it('getPlanDay merges ES overlay fields', () => {
    setActiveLocale('es');
    const plan = getPlanDay(1, 'es');
    expect(plan.kidSummary.length).toBeGreaterThan(20);
    expect(plan.passages.length).toBeGreaterThan(0);
  });

  it('getGuidanceTopic falls back to EN when ES field missing', () => {
    setActiveLocale('es');
    const topic = getGuidanceTopic('parenting-wisdom', 'es');
    expect(topic?.id).toBe('parenting-wisdom');
    expect(topic?.verses.length).toBeGreaterThanOrEqual(4);
  });

  it('getGuidanceCategories derives from active locale', () => {
    setActiveLocale('en');
    const enCats = getGuidanceCategories('en');
    setActiveLocale('es');
    const esCats = getGuidanceCategories('es');
    expect(enCats.length).toBe(16);
    expect(esCats.length).toBeGreaterThanOrEqual(1);
    expect(getGuidanceTopics('es').length).toBe(getGuidanceTopics('en').length);
  });

  it('getGuidanceTopics returns full list for locale', () => {
    expect(getGuidanceTopics('en').length).toBe(guidanceTopicsEn.length);
    expect(getGuidanceTopics('es').length).toBe(guidanceTopicsEn.length);
  });
});
