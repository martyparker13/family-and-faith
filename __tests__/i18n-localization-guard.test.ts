/**
 * Isolated load of i18n when expo-localization throws at getLocales() —
 * a Hermes/release failure mode if the native module is not ready.
 */
jest.mock('expo-localization', () => ({
  getLocales: () => {
    throw new Error('expo-localization native module is not ready');
  },
}));

function loadI18n() {
  return require('@/i18n/index') as typeof import('@/i18n/index');
}

describe('i18n import safety', () => {
  it('imports without throwing when getLocales throws', () => {
    jest.resetModules();
    expect(() => loadI18n()).not.toThrow();
  });

  it('falls back to English for device locale and t()', () => {
    jest.resetModules();
    const { resolveDeviceLocale, resolveLocale, t, setActiveLocale } = loadI18n();
    expect(resolveDeviceLocale()).toBe('en');
    expect(resolveLocale('device')).toBe('en');
    setActiveLocale('en');
    expect(t('tabs.today')).toBe('Today');
  });
});
