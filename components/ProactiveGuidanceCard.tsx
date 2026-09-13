import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { useTranslation } from '@/i18n/context';
import { proactiveGuidanceForDay } from '@/lib/proactive-guidance';
import { useTheme } from '@/lib/theme-context';

/** Surfaces a related Scripture Guidance topic when today's content matches. */
export function ProactiveGuidanceCard({ day }: { day: number }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const match = proactiveGuidanceForDay(day);
  if (!match) return null;

  return (
    <Card
      accent={theme.colors.clay}
      onPress={() => router.push(`/guidance/${match.topicId}`)}
      accessibilityLabel={t('common.relatedGuidanceA11y', { topic: match.topicName })}
      accessibilityHint={t('common.relatedGuidanceHint')}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
        <Ionicons name="compass-outline" size={24} color={theme.colors.clay} />
        <View style={{ flex: 1 }}>
          <AppText variant="caption" bold scaled={false} color={theme.colors.clay}>
            {t('reading.relatedGuidance')}
          </AppText>
          <AppText variant="body" semiBold style={{ marginTop: 2 }}>
            {match.topicName}
          </AppText>
          <AppText variant="small" color={theme.colors.textMuted}>
            {match.reason}
          </AppText>
        </View>
        <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
      </View>
    </Card>
  );
}
