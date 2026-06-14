import React from 'react';
import { Text, type TextProps, type TextStyle } from 'react-native';

import { useTheme } from '@/lib/theme-context';
import { useTextScale } from '@/store/settings';

type Variant =
  | 'caption'
  | 'small'
  | 'body'
  | 'bodyLarge'
  | 'scripture'
  | 'title'
  | 'heading'
  | 'display';

interface AppTextProps extends TextProps {
  variant?: Variant;
  /** Color override; defaults to theme text (muted for captions). */
  color?: string;
  /** Use the serif (Lora) family — scripture & display headings. */
  serif?: boolean;
  bold?: boolean;
  semiBold?: boolean;
  italic?: boolean;
  center?: boolean;
  /**
   * Apply the user's text-size setting. On by default for reading variants
   * (scripture/body/bodyLarge) and off for UI chrome.
   */
  scaled?: boolean;
}

/**
 * Themed text primitive. All app text goes through this so fonts, colors,
 * dynamic type (allowFontScaling) and the in-app text-size setting behave
 * consistently.
 */
export function AppText({
  variant = 'body',
  color,
  serif,
  bold,
  semiBold,
  italic,
  center,
  scaled,
  style,
  ...rest
}: AppTextProps) {
  const theme = useTheme();
  const textScale = useTextScale();

  const isReadingVariant = variant === 'scripture' || variant === 'body' || variant === 'bodyLarge';
  const useScale = scaled ?? isReadingVariant;
  const useSerif = serif ?? (variant === 'scripture' || variant === 'display');

  const family = useSerif
    ? italic
      ? theme.fonts.serifItalic
      : bold || semiBold
        ? theme.fonts.serifBold
        : theme.fonts.serif
    : bold
      ? theme.fonts.sansBold
      : semiBold
        ? theme.fonts.sansSemiBold
        : theme.fonts.sans;

  const scale = useScale ? textScale : 1;
  const textStyle: TextStyle = {
    fontFamily: family,
    fontSize: theme.fontSizes[variant] * scale,
    lineHeight: theme.lineHeights[variant] * scale,
    color: color ?? (variant === 'caption' ? theme.colors.textMuted : theme.colors.text),
    textAlign: center ? 'center' : undefined,
    fontStyle: italic && !useSerif ? 'italic' : undefined,
  };

  return <Text allowFontScaling maxFontSizeMultiplier={1.6} style={[textStyle, style]} {...rest} />;
}
