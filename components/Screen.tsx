import React from 'react';
import { ScrollView, useWindowDimensions, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/lib/theme-context';

/**
 * On tablets, reading-length text lines get uncomfortable — cap content
 * width and center it, like a book page.
 */
export const MAX_CONTENT_WIDTH = 700;

interface ScreenProps {
  children: React.ReactNode;
  /** Scrollable by default; set false for screens that manage their own lists. */
  scroll?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  /** Extra bottom padding (e.g. above a floating action bar). */
  bottomPadding?: number;
}

/**
 * Standard screen wrapper: themed background, safe-area aware padding, and
 * book-width content centering on tablets.
 */
export function Screen({ children, scroll = true, style, contentStyle, bottomPadding }: ScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const base: ViewStyle = { flex: 1, backgroundColor: theme.colors.background };
  const padding: ViewStyle = {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: (bottomPadding ?? theme.spacing.xxl) + insets.bottom,
    // Tablet: hold content to a readable column, centered.
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
  };
  const isWide = width > MAX_CONTENT_WIDTH;

  if (!scroll) {
    return (
      <View style={[base, style]}>
        <View style={[{ flex: 1 }, padding, contentStyle]}>{children}</View>
      </View>
    );
  }
  return (
    <ScrollView
      style={[base, style]}
      contentContainerStyle={[padding, isWide && { paddingHorizontal: theme.spacing.xxl }, contentStyle]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}
