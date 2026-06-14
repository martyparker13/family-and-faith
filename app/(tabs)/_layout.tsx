import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import React from 'react';

import { useTheme } from '@/lib/theme-context';
import { useSettings } from '@/store/settings';

/**
 * Main tab navigator. Redirects to onboarding on first launch so the family
 * can pick their plan start date before anything else.
 */
export default function TabsLayout() {
  const theme = useTheme();
  const onboarded = useSettings((s) => s.onboarded);

  if (!onboarded) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.goldDeep,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          height: 84,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontFamily: theme.fonts.sansBold, fontSize: 12 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarIcon: ({ color, size }) => <Ionicons name="sunny" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="plan"
        options={{
          title: 'Plan',
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="guidance"
        options={{
          title: 'Guidance',
          tabBarIcon: ({ color, size }) => <Ionicons name="compass" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: 'Favorites',
          tabBarIcon: ({ color, size }) => <Ionicons name="heart" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <Ionicons name="settings" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
