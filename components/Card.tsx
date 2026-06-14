import React from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/lib/theme-context';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  /** Colored stripe along the left edge (e.g. blue for readings). */
  accent?: string;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

/**
 * Soft, book-like card. Becomes pressable (with a gentle press state) when
 * onPress is provided.
 */
export function Card({
  children,
  onPress,
  accent,
  style,
  accessibilityLabel,
  accessibilityHint,
}: CardProps) {
  const theme = useTheme();

  const baseStyle: ViewStyle = {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    borderLeftWidth: accent ? 5 : 1,
    borderLeftColor: accent ?? theme.colors.border,
    // Soft shadow (iOS) / elevation (Android)
    shadowColor: '#3D3225',
    shadowOpacity: theme.scheme === 'light' ? 0.06 : 0,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: theme.scheme === 'light' ? 2 : 0,
  };

  if (!onPress) {
    return <View style={[baseStyle, style]}>{children}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [
        baseStyle,
        pressed && { backgroundColor: theme.colors.surfaceAlt, transform: [{ scale: 0.99 }] },
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}
