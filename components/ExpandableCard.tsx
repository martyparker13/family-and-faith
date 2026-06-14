import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { LayoutAnimation, Platform, Pressable, UIManager, View } from 'react-native';

import { AppText } from './AppText';
import { useTheme } from '@/lib/theme-context';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface ExpandableCardProps {
  /** Small label above the title, e.g. "For Little Ones". */
  eyebrow?: string;
  eyebrowColor?: string;
  title: string;
  children: React.ReactNode;
  /** Open initially. */
  defaultOpen?: boolean;
}

/**
 * Tap-to-reveal card used for discussion questions, so parents can reveal
 * one question at a time during family conversation.
 */
export function ExpandableCard({
  eyebrow,
  eyebrowColor,
  title,
  children,
  defaultOpen = false,
}: ExpandableCardProps) {
  const theme = useTheme();
  const [open, setOpen] = useState(defaultOpen);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((o) => !o);
  };

  return (
    <View
      style={{
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        overflow: 'hidden',
      }}
    >
      <Pressable
        onPress={toggle}
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{ expanded: open }}
        accessibilityHint={open ? 'Collapses this question' : 'Reveals this question'}
        style={({ pressed }) => ({
          padding: theme.spacing.lg,
          minHeight: theme.minTouch,
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.spacing.md,
          backgroundColor: pressed ? theme.colors.surfaceAlt : 'transparent',
        })}
      >
        <View style={{ flex: 1 }}>
          {eyebrow ? (
            <AppText
              variant="caption"
              bold
              scaled={false}
              color={eyebrowColor ?? theme.colors.goldDeep}
              style={{ textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 }}
            >
              {eyebrow}
            </AppText>
          ) : null}
          <AppText variant="body" semiBold scaled={false}>
            {title}
          </AppText>
        </View>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={22}
          color={theme.colors.textMuted}
        />
      </Pressable>
      {open ? (
        <View
          style={{
            paddingHorizontal: theme.spacing.lg,
            paddingBottom: theme.spacing.lg,
          }}
        >
          {children}
        </View>
      ) : null}
    </View>
  );
}
