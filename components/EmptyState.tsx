import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View } from 'react-native';

import { AppText } from './AppText';
import { useTheme } from '@/lib/theme-context';

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
}

/** Friendly empty state for lists (favorites, prayer requests…). */
export function EmptyState({ icon, title, message }: EmptyStateProps) {
  const theme = useTheme();
  return (
    <View style={{ alignItems: 'center', paddingVertical: theme.spacing.xxxl, gap: theme.spacing.md }}>
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: theme.colors.surfaceAlt,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={icon} size={34} color={theme.colors.goldDeep} />
      </View>
      <AppText variant="title" semiBold center>
        {title}
      </AppText>
      <AppText variant="body" center color={theme.colors.textMuted} style={{ maxWidth: 280 }}>
        {message}
      </AppText>
    </View>
  );
}
