import {
  Lora_500Medium,
  Lora_500Medium_Italic,
  Lora_600SemiBold,
} from '@expo-google-fonts/lora';
import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from '@expo-google-fonts/nunito';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Confetti } from '@/components/Confetti';
import '@/lib/i18n';
import { applyLanguage } from '@/lib/i18n';
import { todayISO } from '@/lib/dates';
import { ThemeProvider, useTheme } from '@/lib/theme-context';
import { useTranslation } from 'react-i18next';
import { useCelebration } from '@/store/celebration';
import { useDailyContent } from '@/store/daily-content';
import { useSettings } from '@/store/settings';

SplashScreen.preventAutoHideAsync();

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

  const [hydrated, setHydrated] = useState(
    useSettings.persist.hasHydrated() && useDailyContent.persist.hasHydrated()
  );

  useEffect(() => {
    let settingsDone = useSettings.persist.hasHydrated();
    let dailyDone = useDailyContent.persist.hasHydrated();

    const tryComplete = () => {
      if (!settingsDone || !dailyDone) return;
      // Advance daily content if we've rolled past midnight since last open.
      const today = todayISO();
      const daily = useDailyContent.getState();
      if (daily.lastAdvancedDate !== today) daily.advance(today);
      applyLanguage(useSettings.getState().language);
      setHydrated(true);
    };

    const unsubSettings = useSettings.persist.onFinishHydration(() => {
      settingsDone = true;
      tryComplete();
    });
    const unsubDaily = useDailyContent.persist.onFinishHydration(() => {
      dailyDone = true;
      tryComplete();
    });

    tryComplete();

    return () => {
      unsubSettings();
      unsubDaily();
    };
  }, []);

  useEffect(() => {
    if (fontsLoaded && hydrated) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, hydrated]);

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
        <Stack.Screen name="(tabs)" options={{ headerShown: false, title: 'Home' }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="day/[day]/reading" options={{ title: t('reading.screen_title') }} />
        <Stack.Screen name="devotional" options={{ title: t('devotional.screen_title') }} />
        <Stack.Screen name="prayer" options={{ title: t('prayer.screen_title') }} />
        <Stack.Screen name="guidance/[id]" options={{ title: t('guidance.screen_title') }} />
      </Stack>
    </>
  );
}
