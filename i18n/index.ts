/**
 * Lightweight i18n — nested locale JSON with English fallback.
 */
import * as Localization from 'expo-localization';

import en from '@/locales/en.json';
import es from '@/locales/es.json';

export type AppLocale = 'en' | 'es';
export type AppLanguage = AppLocale | 'device';

const LOCALES: Record<AppLocale, Record<string, unknown>> = { en, es };

/** Active locale for non-React callers (content, notifications). */
let activeLocale: AppLocale = resolveDeviceLocale();

export function resolveDeviceLocale(): AppLocale {
  const code = Localization.getLocales()[0]?.languageCode ?? 'en';
  return code.startsWith('es') ? 'es' : 'en';
}

/** Resolve persisted preference: null/device → device locale. */
export function resolveLocale(language: AppLanguage | null | undefined): AppLocale {
  if (language === 'en' || language === 'es') return language;
  return resolveDeviceLocale();
}

export function getLocale(): AppLocale {
  return activeLocale;
}

export function setActiveLocale(locale: AppLocale): void {
  activeLocale = locale;
}

function getNested(obj: Record<string, unknown>, keyPath: string): string | undefined {
  const parts = keyPath.split('.');
  let cur: unknown = obj;
  for (const part of parts) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return typeof cur === 'string' ? cur : undefined;
}

export interface TranslateParams {
  [key: string]: string | number;
}

/**
 * Translate a dot-notation key. Falls back to English, then the key itself.
 * Supports {{placeholder}} interpolation.
 */
export function t(key: string, params?: TranslateParams): string {
  const dict = LOCALES[activeLocale] ?? LOCALES.en;
  let text = getNested(dict, key) ?? getNested(LOCALES.en, key) ?? key;

  if (params) {
    for (const [name, value] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{\\{${name}\\}\\}`, 'g'), String(value));
    }
  }
  return text;
}

/** Flatten nested locale object to count leaf keys (for tests). */
export function flattenKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  const keys: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v != null && typeof v === 'object' && !Array.isArray(v)) {
      keys.push(...flattenKeys(v as Record<string, unknown>, path));
    } else {
      keys.push(path);
    }
  }
  return keys;
}
