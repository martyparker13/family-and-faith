import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { ProgressBar } from '@/components/ProgressBar';
import { timelineInfo } from '@/lib/bible-timeline';
import { useTheme } from '@/lib/theme-context';

/** Simple OT narrative progress bar — tap for "where we are". */
export function BibleTimeline({ day }: { day: number }) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const info = timelineInfo(day);

  return (
    <Pressable
      onPress={() => setExpanded((v) => !v)}
      accessibilityRole="button"
      accessibilityLabel={`Bible story progress, ${info.percent} percent. Tap for details.`}
      accessibilityState={{ expanded }}
    >
      <View
        style={{
          backgroundColor: theme.colors.surfaceAlt,
          borderRadius: theme.radius.md,
          padding: theme.spacing.md,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: theme.spacing.sm,
          }}
        >
          <AppText variant="small" semiBold scaled={false}>
            Where we are in the story
          </AppText>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={theme.colors.textMuted}
          />
        </View>
        <ProgressBar percent={info.percent} />
        {expanded ? (
          <View style={{ marginTop: theme.spacing.sm }}>
            <AppText variant="small" color={theme.colors.textMuted}>
              {info.label} — {info.otReference}
            </AppText>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}
