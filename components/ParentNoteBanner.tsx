import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { LayoutAnimation, Platform, Pressable, UIManager, View } from 'react-native';

import { AppText } from '@/components/AppText';
import type { ParentNotes } from '@/lib/content';
import { parentNotesForDisplay } from '@/lib/parent-notes';
import { useTheme } from '@/lib/theme-context';
import { useSettings } from '@/store/settings';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/**
 * Collapsible guidance for sensitive readings — age-band aware using
 * configured children, with optional "Show all ages" toggle.
 */
export function ParentNoteBanner({ parentNotes }: { parentNotes: ParentNotes }) {
  const theme = useTheme();
  const children = useSettings((s) => s.children);
  const [open, setOpen] = useState(true);
  const [showAll, setShowAll] = useState(false);

  const displays = parentNotesForDisplay(parentNotes, children, showAll);

  const toggleOpen = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((v) => !v);
  };

  return (
    <View
      style={{
        backgroundColor: theme.colors.surfaceAlt,
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        marginTop: theme.spacing.md,
        overflow: 'hidden',
      }}
    >
      <Pressable
        onPress={toggleOpen}
        accessibilityRole="button"
        accessibilityLabel="Parent note for today's reading"
        accessibilityState={{ expanded: open }}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.spacing.sm,
          padding: theme.spacing.md,
          backgroundColor: pressed ? theme.colors.surface : 'transparent',
        })}
      >
        <Ionicons name="shield-checkmark-outline" size={20} color={theme.colors.clay} />
        <View style={{ flex: 1 }}>
          <AppText variant="caption" bold scaled={false} color={theme.colors.clay}>
            PARENT NOTE · {parentNotes.trigger.toUpperCase()}
          </AppText>
          {!open ? (
            <AppText variant="small" color={theme.colors.textMuted} numberOfLines={1}>
              {displays[0]?.text}
            </AppText>
          ) : null}
        </View>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={theme.colors.textMuted}
        />
      </Pressable>

      {open ? (
        <View style={{ paddingHorizontal: theme.spacing.md, paddingBottom: theme.spacing.md }}>
          {children.length > 0 ? (
            <Pressable
              onPress={() => setShowAll((v) => !v)}
              accessibilityRole="button"
              style={{ alignSelf: 'flex-end', marginBottom: theme.spacing.sm }}
            >
              <AppText variant="small" semiBold color={theme.colors.goldDeep}>
                {showAll ? 'Match ages' : 'Show all ages'}
              </AppText>
            </Pressable>
          ) : null}
          {displays.map((item) => (
            <View key={item.band} style={{ marginTop: theme.spacing.sm }}>
              <AppText variant="caption" semiBold scaled={false} color={theme.colors.goldDeep}>
                {item.label}
              </AppText>
              <AppText variant="body" style={{ marginTop: 4 }}>
                {item.text}
              </AppText>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
