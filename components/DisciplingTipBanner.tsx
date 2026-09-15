import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { useTranslation } from '@/i18n/context';
import { disciplingTipForPlanDay, type DisciplingTip } from '@/lib/discipling-tips';
import { useTheme } from '@/lib/theme-context';
import { useSettings } from '@/store/settings';

/** Collapsible first-time discipling tip for plan days 1–14. */
export function DisciplingTipBanner({ planDaySinceStart }: { planDaySinceStart: number }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const dismissed = useSettings((s) => s.dismissedDisciplingTips);
  const dismissTip = useSettings((s) => s.dismissDisciplingTip);
  const [expanded, setExpanded] = useState(true);

  const tip: DisciplingTip | null = disciplingTipForPlanDay(planDaySinceStart);
  if (!tip || dismissed.includes(tip.id)) return null;

  return (
    <Card accent={theme.colors.blue} style={{ marginBottom: theme.spacing.md }}>
      <Pressable
        onPress={() => setExpanded((e) => !e)}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={t('common.disciplingTipA11y', { day: tip.day, title: tip.title })}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
          <Ionicons name="heart-outline" size={20} color={theme.colors.blue} />
          <AppText variant="small" semiBold scaled={false} color={theme.colors.blue} style={{ flex: 1 }}>
            {t('common.dayTipTitle', { day: tip.day, title: tip.title })}
          </AppText>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={theme.colors.textMuted}
          />
        </View>
      </Pressable>
      {expanded ? (
        <AppText variant="body" style={{ marginTop: theme.spacing.sm }}>
          {tip.body}
        </AppText>
      ) : null}
      <Pressable
        onPress={() => dismissTip(tip.id)}
        accessibilityRole="button"
        accessibilityLabel={t('common.dismissTipA11y')}
        style={{ marginTop: theme.spacing.sm }}
      >
        <AppText variant="small" semiBold color={theme.colors.textMuted}>
          {t('common.gotItHideTip')}
        </AppText>
      </Pressable>
    </Card>
  );
}
