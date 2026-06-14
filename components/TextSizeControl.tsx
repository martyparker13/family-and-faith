import React from 'react';
import { Pressable, View } from 'react-native';

import { AppText } from './AppText';
import { useTheme } from '@/lib/theme-context';
import { TEXT_SCALE_STEPS, useSettings } from '@/store/settings';

/** "A− / A+" stepper that adjusts the reading text size app-wide. */
export function TextSizeControl() {
  const theme = useTheme();
  const index = useSettings((s) => s.textScaleIndex);
  const setIndex = useSettings((s) => s.setTextScaleIndex);

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.radius.pill,
      }}
    >
      <SizeButton label="A−" a11y="Make text smaller" disabled={index === 0} onPress={() => setIndex(index - 1)} />
      <View style={{ width: 1, height: 24, backgroundColor: theme.colors.border }} />
      <SizeButton
        label="A+"
        a11y="Make text larger"
        disabled={index === TEXT_SCALE_STEPS.length - 1}
        onPress={() => setIndex(index + 1)}
      />
    </View>
  );
}

function SizeButton({
  label,
  a11y,
  disabled,
  onPress,
}: {
  label: string;
  a11y: string;
  disabled: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      accessibilityState={{ disabled }}
      style={({ pressed }) => ({
        minWidth: theme.minTouch,
        minHeight: theme.minTouch,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.35 : pressed ? 0.6 : 1,
        paddingHorizontal: theme.spacing.md,
      })}
    >
      <AppText variant="bodyLarge" bold scaled={false}>
        {label}
      </AppText>
    </Pressable>
  );
}
