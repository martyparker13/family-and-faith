import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';

import { darkTheme, lightTheme, type Theme } from '@/theme';
import { useSettings } from '@/store/settings';

const ThemeContext = createContext<Theme>(lightTheme);

/**
 * Resolves the active theme from the user's preference ("system" follows the
 * OS) and provides it to the whole app. Components read it with useTheme().
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const preference = useSettings((s) => s.themePreference);

  const theme = useMemo(() => {
    const scheme = preference === 'system' ? (systemScheme ?? 'light') : preference;
    return scheme === 'dark' ? darkTheme : lightTheme;
  }, [preference, systemScheme]);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
