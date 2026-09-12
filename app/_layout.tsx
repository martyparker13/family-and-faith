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
import { deepLinkToRoute } from '@/lib/import-data';
import { scheduleRhythmReminders } from '@/lib/notifications';
import { allStoresHydrated, waitForAllStoresHydrated } from '@/lib/store-hydration';
import { ThemeProvider, useTheme } from '@/lib/theme-context';
import { useCelebration } from '@/store/celebration';
import { useSettings } from '@/store/settings';

SplashScreen.preventAutoHideAsync();

/**
 * Root layout: loads fonts, waits for all persisted stores to hydrate,
 * re-registers rhythm reminders from saved settings, handles deep links,
 * and mounts the navigation stack.
 */
export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Lora_500Medium,
    Lora_500Medium_Italic,
    Lora_600SemiBold,
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });
  const [hydrated, setHydrated] = useState(allStoresHydrated());
  const morningReminder = useSettings((s) => s.morningReminder);
  const dinnerReminder = useSettings((s) => s.dinnerReminder);
  const bedtimeReminder = useSettings((s) => s.bedtimeReminder);

  useEffect(() => {
    if (hydrated) return;
    let cancelled = false;
    waitForAllStoresHydrated().then(() => {
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
    if (fontsLoaded && hydrated) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, hydrated]);

  useEffect(() => {
    const handleUrl = (event: { url: string }) => {
      const route = deepLinkToRoute(event.url);
      if (route) router.push(route as '/rhythm/morning');
    };
    Linking.getInitialURL().then((url) => {
      if (url) handleUrl({ url });
    });
    const sub = Linking.addEventListener('url', handleUrl);
    return () => sub.remove();
  }, []);

  if (!fontsLoaded || !hydrated) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <RootStack />
        <CelebrationOverlay />
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
        <Stack.Screen name="(tabs)" options={{ headerShown: false, title: 'Home' }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="quick-evening" options={{ title: 'Five-minute moment' }} />
        <Stack.Screen name="rhythm/[slot]" options={{ title: 'Family rhythm' }} />
        <Stack.Screen name="recap" options={{ title: 'Weekly recap' }} />
        <Stack.Screen name="day/[day]/reading" options={{ title: 'Daily Reading' }} />
        <Stack.Screen name="day/[day]/devotional" options={{ title: 'Devotional' }} />
        <Stack.Screen name="day/[day]/prayer" options={{ title: 'Family Prayer' }} />
        <Stack.Screen name="guidance/[id]" options={{ title: 'Scripture Guidance' }} />
      </Stack>
    </>
  );
}
