import { getLocales } from 'expo-localization';
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from '@/locales/en.json';
import es from '@/locales/es.json';

export type AppLanguage = 'system' | 'en' | 'es';

i18next.use(initReactI18next).init({
  resources: { en: { translation: en }, es: { translation: es } },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

/** Resolves 'system' to a concrete 'en'|'es' code using the device locale. */
export function resolveLanguage(pref: AppLanguage): 'en' | 'es' {
  if (pref === 'en' || pref === 'es') return pref;
  const device = getLocales()[0]?.languageCode ?? 'en';
  return device.startsWith('es') ? 'es' : 'en';
}

/** Call this whenever the stored language preference changes. */
export function applyLanguage(pref: AppLanguage) {
  i18next.changeLanguage(resolveLanguage(pref));
}

export default i18next;
