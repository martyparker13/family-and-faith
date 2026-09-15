/**
 * React i18n context — re-renders when language preference changes.
 */
import React, { createContext, useContext, useEffect, useMemo } from 'react';

import { resolveLocale, setActiveLocale, t, type AppLocale, type TranslateParams } from '@/i18n/index';
import { useSettings, type AppLanguage } from '@/store/settings';

interface I18nContextValue {
  locale: AppLocale;
  language: AppLanguage;
  t: (key: string, params?: TranslateParams) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const language = useSettings((s) => s.language);
  const locale = resolveLocale(language);

  useEffect(() => {
    setActiveLocale(locale);
  }, [locale]);

  const value = useMemo(
    () => ({
      locale,
      language,
      t: (key: string, params?: TranslateParams) => {
        setActiveLocale(locale);
        return t(key, params);
      },
    }),
    [locale, language]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return ctx;
}

/** Shorthand hook — most screens only need `t`. */
export function useTranslation() {
  const { t: translate, locale } = useI18n();
  return { t: translate, locale };
}
