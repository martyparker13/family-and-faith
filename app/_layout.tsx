import {
  Lora_500Medium,
  Lora_500Medium_Italic,
  Lora_600SemiBold,
  useFonts,
} from '@expo-google-fonts/lora';
import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from '@expo-google-fonts/nunito';
import * as Linking from 'expo-linking';
import { Stack, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Confetti } from '@/components/Confetti';
import { I18nProvider, useTranslation } from '@/i18n/context';
import { resolveLocale, setActiveLocale } from '@/i18n/index';
import { deepLinkToRoute } from '@/lib/import-data';
import { initializeNotifications, scheduleRhythmReminders } from '@/lib/notifications';
import { allStoresHydrated, waitForAllStoresHydrated } from '@/lib/store-hydration';
import { ThemeProvider, useTheme } from '@/lib/theme-context';
import { useCelebration } from '@/store/celebration';
import { useSettings } from '@/store/settings';

try {
  SplashScreen.preventAutoHideAsync().catch(() => {
    // Native splash may already be hidden in some release paths.
  });
} catch {
  // preventAutoHideAsync must not take down the root layout.
}

/**
 * Root layout: loads fonts, waits for all persisted stores to hydrate,
 * re-registers rhythm reminders from saved settings, handles deep links,
 * and mounts the navigation stack.
 *
 * Production/release: fonts, i18n, notifications, linking, and splash must
 * not throw. A font or hydration failure still shows the UI.
 */
export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Lora_500Medium,
    Lora_500Medium_Italic,
    Lora_600SemiBold,
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });
  const fontsReady = fontsLoaded || !!fontError;
  const [hydrated, setHydrated] = useState(() => {
    try {
      return allStoresHydrated();
    } catch {
      return true;
    }
  });
  const morningReminder = useSettings((s) => s.morningReminder);
  const dinnerReminder = useSettings((s) => s.dinnerReminder);
  const bedtimeReminder = useSettings((s) => s.bedtimeReminder);
  const language = useSettings((s) => s.language);

  useEffect(() => {
    initializeNotifications();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      setActiveLocale(resolveLocale(language));
    } catch {
      // Keep the last locale rather than crashing launch.
    }
  }, [hydrated, language]);

  useEffect(() => {
    if (hydrated) return;
    let cancelled = false;
    waitForAllStoresHydrated()
      .then(() => {
        if (!cancelled) setHydrated(true);
      })
      .catch(() => {
        if (!cancelled) setHydrated(true);
      });
    return () => {
      cancelled = true;
    };
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    scheduleRhythmReminders({
      morning: morningReminder,
      dinner: dinnerReminder,
      bedtime: bedtimeReminder,
    }).catch(() => {
      // Permission or platform issues — user can re-enable in Settings.
    });
  }, [hydrated, morningReminder, dinnerReminder, bedtimeReminder]);

  useEffect(() => {
    if (fontsReady && hydrated) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsReady, hydrated]);

  useEffect(() => {
    const handleUrl = (event: { url: string }) => {
      try {
        const route = deepLinkToRoute(event.url);
        if (route) router.push(route as '/rhythm/morning');
      } catch {
        // Ignore malformed deep links.
      }
    };
    Linking.getInitialURL()
      .then((url) => {
        if (url) handleUrl({ url });
      })
      .catch(() => {});
    try {
      const sub = Linking.addEventListener('url', handleUrl);
      return () => {
        try {
          sub.remove();
        } catch {
          // Listener may already be gone.
        }
      };
    } catch {
      return undefined;
    }
  }, []);

  if (!fontsReady || !hydrated) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <I18nProvider>
          <RootStack />
          <CelebrationOverlay />
        </I18nProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function CelebrationOverlay() {
  const { burst, message, size } = useCelebration();
  return <Confetti burst={burst} message={message} size={size} />;
}

function RootStack() {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <>
      <StatusBar style={theme.scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.colors.background },
          headerTintColor: theme.colors.text,
          headerTitleStyle: { fontFamily: theme.fonts.sansBold },
          headerShadowVisible: false,
          headerBackButtonDisplayMode: 'minimal',
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false, title: t('navigation.home') }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="quick-evening" options={{ title: t('navigation.fiveMinuteMoment') }} />
        <Stack.Screen name="rhythm/[slot]" options={{ title: t('navigation.familyRhythm') }} />
        <Stack.Screen name="recap" options={{ title: t('navigation.weeklyRecap') }} />
        <Stack.Screen name="day/[day]/reading" options={{ title: t('navigation.dailyReading') }} />
        <Stack.Screen name="day/[day]/devotional" options={{ title: t('navigation.devotional') }} />
        <Stack.Screen name="day/[day]/prayer" options={{ title: t('navigation.familyPrayer') }} />
        <Stack.Screen name="guidance/[id]" options={{ title: t('navigation.scriptureGuidance') }} />
      </Stack>
    </>
  );
}
