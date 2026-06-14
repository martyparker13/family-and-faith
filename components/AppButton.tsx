import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Pressable, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from './AppText';
import { useTheme } from '@/lib/theme-context';

interface AppButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
}

/** Large, kid-friendly button with generous touch target. */
export function AppButton({
  label,
  onPress,
  variant = 'primary',
  icon,
  disabled,
  loading,
  style,
  accessibilityHint,
}: AppButtonProps) {
  const theme = useTheme();

  const background =
    variant === 'primary' ? theme.colors.gold : variant === 'secondary' ? theme.colors.surfaceAlt : 'transparent';
  const textColor =
    variant === 'primary'
      ? theme.colors.onAccent
      : variant === 'secondary'
        ? theme.colors.text
        : theme.colors.goldDeep;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [
        {
          minHeight: theme.minTouch + 4,
          borderRadius: theme.radius.pill,
          backgroundColor: background,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: theme.spacing.sm,
          paddingHorizontal: theme.spacing.xl,
          paddingVertical: theme.spacing.md,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
          borderWidth: variant === 'secondary' ? 1 : 0,
          borderColor: theme.colors.border,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={20} color={textColor} /> : null}
          <AppText variant="bodyLarge" semiBold color={textColor} scaled={false}>
            {label}
          </AppText>
        </>
      )}
    </Pressable>
  );
}
