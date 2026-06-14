import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, View } from 'react-native';

import { AppText } from './AppText';
import { useTheme } from '@/lib/theme-context';

interface DayNavigatorProps {
  day: number;
  /** Optional line under the day number (e.g. the calendar date). */
  subtitle?: string;
  onChange: (day: number) => void;
}

/**
 * Previous/next day stepper shown on the reading, devotional, and prayer
 * screens so families can catch up on missed days or peek ahead.
 */
export function DayNavigator({ day, subtitle, onChange }: DayNavigatorProps) {
  const theme = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: theme.spacing.sm,
      }}
    >
      <NavButton
        icon="chevron-back"
        label="Previous day"
        disabled={day <= 1}
        onPress={() => onChange(day - 1)}
      />
      <View style={{ alignItems: 'center' }}>
        <AppText variant="title" semiBold accessibilityRole="header">
          Day {day} of 365
        </AppText>
        {subtitle ? (
          <AppText variant="caption" scaled={false}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      <NavButton
        icon="chevron-forward"
        label="Next day"
        disabled={day >= 365}
        onPress={() => onChange(day + 1)}
      />
    </View>
  );
}

function NavButton({
  icon,
  label,
  disabled,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={({ pressed }) => ({
        width: theme.minTouch,
        height: theme.minTouch,
        borderRadius: theme.radius.pill,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.3 : pressed ? 0.6 : 1,
      })}
    >
      <Ionicons name={icon} size={24} color={theme.colors.text} />
    </Pressable>
  );
}
