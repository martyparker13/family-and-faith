/**
 * Lightweight i18n — nested locale JSON with English fallback.
 *
 * Import-time must never throw: expo-localization's getLocales() and the
 * locale JSON requires can fail in a Hermes release build. Fall back to
 * English and keep translating.
 */
import * as Localization from 'expo-localization';

export type AppLocale = 'en' | 'es';
export type AppLanguage = AppLocale | 'device';

function loadLocaleDict(loader: () => Record<string, unknown>): Record<string, unknown> {
  try {
    return loader();
  } catch {
    return {};
  }
}

const en = loadLocaleDict(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('@/locales/en.json') as Record<string, unknown>;
});
const es = loadLocaleDict(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('@/locales/es.json') as Record<string, unknown>;
});

const LOCALES: Record<AppLocale, Record<string, unknown>> = { en, es };

/** Active locale for non-React callers (content, notifications). */
let activeLocale: AppLocale = 'en';
try {
  activeLocale = resolveDeviceLocale();
} catch {
  activeLocale = 'en';
}

export function resolveDeviceLocale(): AppLocale {
  try {
    const locales = Localization.getLocales();
    const code = locales[0]?.languageCode ?? 'en';
    return code.startsWith('es') ? 'es' : 'en';
  } catch {
    return 'en';
  }
}

/** Resolve persisted preference: null/device → device locale. */
export function resolveLocale(language: AppLanguage | null | undefined): AppLocale {
  try {
    if (language === 'en' || language === 'es') return language;
    return resolveDeviceLocale();
  } catch {
    return 'en';
  }
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
  try {
    const dict = LOCALES[activeLocale] ?? LOCALES.en;
    let text = getNested(dict, key) ?? getNested(LOCALES.en, key) ?? key;

    if (params) {
      for (const [name, value] of Object.entries(params)) {
        text = text.replace(new RegExp(`\\{\\{${name}\\}\\}`, 'g'), String(value));
      }
    }
    return text;
  } catch {
    return key;
  }
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
