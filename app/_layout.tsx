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
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Confetti } from '@/components/Confetti';
import { ThemeProvider, useTheme } from '@/lib/theme-context';
import { useCelebration } from '@/store/celebration';
import { useSettings } from '@/store/settings';

SplashScreen.preventAutoHideAsync();

/**
 * Root layout: loads the font pairing (Lora for scripture, Nunito for UI),
 * waits for the persisted settings store to hydrate from AsyncStorage, and
 * mounts the navigation stack inside the theme provider.
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
  const [hydrated, setHydrated] = useState(useSettings.persist.hasHydrated());

  useEffect(() => {
    const unsub = useSettings.persist.onFinishHydration(() => setHydrated(true));
    return unsub;
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

/** Global confetti layer — sits above the navigator so bursts cover the screen. */
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
          // Chevron-only back button (otherwise iOS labels it with the
          // previous route's name, e.g. "(tabs)").
          headerBackButtonDisplayMode: 'minimal',
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false, title: 'Home' }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="day/[day]/reading" options={{ title: 'Daily Reading' }} />
        <Stack.Screen name="day/[day]/devotional" options={{ title: 'Devotional' }} />
        <Stack.Screen name="day/[day]/prayer" options={{ title: 'Family Prayer' }} />
        <Stack.Screen name="guidance/[id]" options={{ title: 'Scripture Guidance' }} />
      </Stack>
    </>
  );
}
