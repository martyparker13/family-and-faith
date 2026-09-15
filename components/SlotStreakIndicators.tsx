import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/AppText';
import { useTranslation } from '@/i18n/context';
import { allSlotStreaks } from '@/lib/streaks';
import { getSlotLabels, type RhythmSlot } from '@/lib/rhythm';
import { useTheme } from '@/lib/theme-context';
import { useProgress } from '@/store/progress';

const SLOTS: { key: RhythmSlot; icon: 'sunny' | 'restaurant' | 'moon' }[] = [
  { key: 'morning', icon: 'sunny' },
  { key: 'dinner', icon: 'restaurant' },
  { key: 'bedtime', icon: 'moon' },
];

/** Three small streak indicators for the daily rhythm. */
export function SlotStreakIndicators({ todayISO }: { todayISO: string }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const slotCompletions = useProgress((s) => s.slotCompletions);
  const streaks = allSlotStreaks(slotCompletions, todayISO);

  return (
    <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
      {SLOTS.map(({ key, icon }) => {
        const label = getSlotLabels(key).short;
        return (
          <View
            key={key}
            style={{
              flex: 1,
              alignItems: 'center',
              backgroundColor: theme.colors.surfaceAlt,
              borderRadius: theme.radius.md,
              paddingVertical: theme.spacing.sm,
            }}
            accessibilityLabel={t('common.slotStreakA11y', { label, count: streaks[key] })}
          >
            <Ionicons name={icon} size={18} color={theme.colors.goldDeep} />
            <AppText variant="caption" semiBold scaled={false} style={{ marginTop: 2 }}>
              {streaks[key]}
            </AppText>
          </View>
        );
      })}
    </View>
  );
}
