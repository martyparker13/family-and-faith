import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/AppText';
import { allSlotStreaks } from '@/lib/streaks';
import { useTheme } from '@/lib/theme-context';
import { useProgress } from '@/store/progress';

const SLOTS = [
  { key: 'morning' as const, icon: 'sunny' as const, label: 'Morning' },
  { key: 'dinner' as const, icon: 'restaurant' as const, label: 'Dinner' },
  { key: 'bedtime' as const, icon: 'moon' as const, label: 'Bedtime' },
];

/** Three small streak indicators for the daily rhythm. */
export function SlotStreakIndicators({ todayISO }: { todayISO: string }) {
  const theme = useTheme();
  const slotCompletions = useProgress((s) => s.slotCompletions);
  const streaks = allSlotStreaks(slotCompletions, todayISO);

  return (
    <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
      {SLOTS.map(({ key, icon, label }) => (
        <View
          key={key}
          style={{
            flex: 1,
            alignItems: 'center',
            backgroundColor: theme.colors.surfaceAlt,
            borderRadius: theme.radius.md,
            paddingVertical: theme.spacing.sm,
          }}
          accessibilityLabel={`${label} streak, ${streaks[key]} days`}
        >
          <Ionicons name={icon} size={18} color={theme.colors.goldDeep} />
          <AppText variant="caption" semiBold scaled={false} style={{ marginTop: 2 }}>
            {streaks[key]}
          </AppText>
        </View>
      ))}
    </View>
  );
}
