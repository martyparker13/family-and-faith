import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/AppText';
import { useTranslation } from '@/i18n/context';
import { parentTipFor, type ParentTipScreen } from '@/lib/parent-tips';
import { useTheme } from '@/lib/theme-context';

/** Lead tip for parents at the top of activity screens. */
export function ParentTipBanner({ screen, day }: { screen: ParentTipScreen; day: number }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const tip = parentTipFor(screen, day);

  return (
    <View
      style={{
        flexDirection: 'row',
        gap: theme.spacing.sm,
        alignItems: 'flex-start',
        backgroundColor: theme.colors.surfaceAlt,
        borderRadius: theme.radius.md,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.md,
      }}
    >
      <Ionicons name="bulb-outline" size={20} color={theme.colors.goldDeep} />
      <AppText variant="small" color={theme.colors.textMuted} style={{ flex: 1 }}>
        <AppText variant="small" semiBold scaled={false} color={theme.colors.goldDeep}>
          {t('common.parentTipPrefix')}
        </AppText>
        {tip}
      </AppText>
    </View>
  );
}
