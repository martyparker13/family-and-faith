import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { ExpandableCard } from '@/components/ExpandableCard';
import { Screen } from '@/components/Screen';
import { SectionLabel } from '@/components/SectionLabel';
import { TextSizeControl } from '@/components/TextSizeControl';
import { celebrationFor, celebrationHaptics, undoHaptics } from '@/lib/celebrate';
import { getDevotional } from '@/lib/content';
import { todayISO } from '@/lib/dates';
import { useTheme } from '@/lib/theme-context';
import { useCelebration } from '@/store/celebration';
import { todayContentIndex, useDailyContent } from '@/store/daily-content';
import { useProgress } from '@/store/progress';
import { useSettings } from '@/store/settings';
import { currentPlanDay } from '@/lib/dates';

export default function DevotionalScreen() {
  const { t } = useTranslation();
  const theme = useTheme();

  const contentIndex = useDailyContent(todayContentIndex);
  const devotionalDoneDate = useDailyContent((s) => s.devotionalDoneDate);
  const markDevotionalDone = useDailyContent((s) => s.markDevotionalDone);
  const unmarkDevotionalDone = useDailyContent((s) => s.unmarkDevotionalDone);
  const fire = useCelebration((s) => s.fire);

  const today = todayISO();
  const done = devotionalDoneDate === today;

  const devotional = getDevotional(contentIndex);
  const littleQs = devotional.questions.filter((q) => q.audience === 'little');
  const olderQs = devotional.questions.filter((q) => q.audience === 'older');

  const handleToggle = () => {
    if (done) {
      unmarkDevotionalDone();
      undoHaptics();
      return;
    }
    markDevotionalDone(today);
    const progress = useProgress.getState();
    const daily = useDailyContent.getState();
    const planStartDate = useSettings.getState().planStartDate;
    const readingDay = planStartDate ? currentPlanDay(planStartDate, today) : 1;
    const celebration = celebrationFor(
      progress.completedDays,
      readingDay,
      true,
      Boolean(daily.prayerDoneDate),
      [today, daily.prayerDoneDate],
      today
    );
    fire(celebration);
    celebrationHaptics(celebration.size);
  };

  return (
    <Screen>
      <AppText
        variant="display"
        center
        accessibilityRole="header"
        style={{ marginTop: theme.spacing.xl }}
      >
        {devotional.title}
      </AppText>

      {/* Anchor scripture */}
      <Card accent={theme.colors.clay} style={{ marginTop: theme.spacing.lg }}>
        <AppText variant="scripture" italic>
          "{devotional.scripture.text}"
        </AppText>
        <AppText
          variant="small"
          semiBold
          color={theme.colors.goldDeep}
          style={{ marginTop: theme.spacing.sm }}
        >
          — {devotional.scripture.reference} {t('devotional.scripture_credit')}
        </AppText>
      </Card>

      <View style={{ alignItems: 'flex-end', marginTop: theme.spacing.md }}>
        <TextSizeControl />
      </View>

      {/* Reflection */}
      {devotional.reflection.split('\n\n').map((paragraph, i) => (
        <AppText key={i} variant="bodyLarge" style={{ marginTop: theme.spacing.lg }}>
          {paragraph}
        </AppText>
      ))}

      {/* Discussion questions — revealed one at a time */}
      <SectionLabel color={theme.colors.clay}>{t('devotional.talk_together')}</SectionLabel>
      <View style={{ gap: theme.spacing.md }}>
        {littleQs.map((q, i) => (
          <ExpandableCard
            key={`little-${i}`}
            eyebrow={t('devotional.for_little_ones')}
            eyebrowColor={theme.colors.green}
            title={t('common.question', { n: i + 1 })}
          >
            <AppText variant="bodyLarge">{q.question}</AppText>
          </ExpandableCard>
        ))}
        {olderQs.map((q, i) => (
          <ExpandableCard
            key={`older-${i}`}
            eyebrow={t('devotional.for_older')}
            eyebrowColor={theme.colors.blue}
            title={t('common.question', { n: littleQs.length + i + 1 })}
          >
            <AppText variant="bodyLarge">{q.question}</AppText>
          </ExpandableCard>
        ))}
      </View>

      {/* Family challenge */}
      <SectionLabel color={theme.colors.goldDeep}>{t('devotional.family_challenge')}</SectionLabel>
      <Card accent={theme.colors.gold}>
        <View style={{ flexDirection: 'row', gap: theme.spacing.md, alignItems: 'flex-start' }}>
          <Ionicons name="star" size={24} color={theme.colors.gold} />
          <AppText variant="bodyLarge" style={{ flex: 1 }}>
            {devotional.familyChallenge}
          </AppText>
        </View>
      </Card>

      <View style={{ marginTop: theme.spacing.xl }}>
        <AppButton
          label={done ? t('devotional.completed_label') : t('devotional.mark_complete')}
          icon={done ? 'checkmark-circle' : 'ellipse-outline'}
          variant={done ? 'secondary' : 'primary'}
          onPress={handleToggle}
          accessibilityHint="Tracks this in your family's daily progress"
        />
      </View>
      <AppButton
        label={t('devotional.write_journal')}
        icon="create-outline"
        variant="ghost"
        onPress={() => router.push('/journal')}
        style={{ marginTop: theme.spacing.md }}
      />
    </Screen>
  );
}
