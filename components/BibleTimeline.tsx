import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { ProgressBar } from '@/components/ProgressBar';
import { useTranslation } from '@/i18n/context';
import { timelineInfo } from '@/lib/bible-timeline';
import { useTheme } from '@/lib/theme-context';

/** Simple OT narrative progress bar — tap for "where we are". */
export function BibleTimeline({ day }: { day: number }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const info = timelineInfo(day);

  return (
    <Pressable
      onPress={() => setExpanded((v) => !v)}
      accessibilityRole="button"
      accessibilityLabel={t('common.bibleProgressA11y', { percent: info.percent })}
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
            {t('reading.whereWeAre')}
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
              {t('reading.timelineDetail', { label: info.label, reference: info.otReference })}
            </AppText>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}
