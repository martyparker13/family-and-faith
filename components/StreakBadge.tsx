import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View } from 'react-native';

import { AppText } from './AppText';
import { useTheme } from '@/lib/theme-context';

/**
 * The family streak flame. Grows warmer with longer streaks — a small,
 * joyful reward for showing up together day after day.
 */
export function StreakBadge({ streak }: { streak: number }) {
  const theme = useTheme();
  const active = streak > 0;
  const flameColor = !active
    ? theme.colors.textMuted
    : streak >= 30
      ? theme.colors.clay
      : theme.colors.gold;

  return (
    <View
      accessibilityLabel={
        active ? `${streak} day family streak` : 'No streak yet — read today to start one'
      }
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
        borderWidth: 1,
        borderRadius: theme.radius.pill,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
      }}
    >
      <Ionicons name={active ? 'flame' : 'flame-outline'} size={22} color={flameColor} />
      <AppText variant="bodyLarge" bold scaled={false} color={active ? theme.colors.text : theme.colors.textMuted}>
        {streak}
      </AppText>
      <AppText variant="caption" scaled={false}>
        day{streak === 1 ? '' : 's'}
      </AppText>
    </View>
  );
}
