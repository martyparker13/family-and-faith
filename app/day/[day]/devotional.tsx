import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { CompleteActivityButton } from '@/components/CompleteActivityButton';
import { DayNavigator } from '@/components/DayNavigator';
import { ExpandableCard } from '@/components/ExpandableCard';
import { Screen } from '@/components/Screen';
import { SectionLabel } from '@/components/SectionLabel';
import { TextSizeControl } from '@/components/TextSizeControl';
import { getDevotional } from '@/lib/content';
import { useTheme } from '@/lib/theme-context';

/**
 * Feature 2 — Daily Devotional screen.
 * A cozy reading layout: anchor scripture, warm reflection, tiered
 * discussion questions as tap-to-reveal cards (so parents can reveal one at
 * a time during conversation), and the day's Family Challenge.
 */
export default function DevotionalScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ day: string }>();
  const day = Math.min(365, Math.max(1, parseInt(params.day ?? '1', 10) || 1));
  const devotional = getDevotional(day);

  const littleQs = devotional.questions.filter((q) => q.audience === 'little');
  const olderQs = devotional.questions.filter((q) => q.audience === 'older');

  return (
    <Screen>
      <DayNavigator
        day={day}
        subtitle={devotional.theme}
        onChange={(next) => router.setParams({ day: String(next) })}
      />

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
          “{devotional.scripture.text}”
        </AppText>
        <AppText
          variant="small"
          semiBold
          color={theme.colors.goldDeep}
          style={{ marginTop: theme.spacing.sm }}
        >
          — {devotional.scripture.reference} (WEB)
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
      <SectionLabel color={theme.colors.clay}>Talk about it together</SectionLabel>
      <View style={{ gap: theme.spacing.md }}>
        {littleQs.map((q, i) => (
          <ExpandableCard
            key={`little-${i}`}
            eyebrow="For Little Ones"
            eyebrowColor={theme.colors.green}
            title={`Question ${i + 1}`}
          >
            <AppText variant="bodyLarge">{q.question}</AppText>
          </ExpandableCard>
        ))}
        {olderQs.map((q, i) => (
          <ExpandableCard
            key={`older-${i}`}
            eyebrow="For Older Kids & Parents"
            eyebrowColor={theme.colors.blue}
            title={`Question ${littleQs.length + i + 1}`}
          >
            <AppText variant="bodyLarge">{q.question}</AppText>
          </ExpandableCard>
        ))}
      </View>

      {/* Family challenge */}
      <SectionLabel color={theme.colors.goldDeep}>Family challenge</SectionLabel>
      <Card accent={theme.colors.gold}>
        <View style={{ flexDirection: 'row', gap: theme.spacing.md, alignItems: 'flex-start' }}>
          <Ionicons name="star" size={24} color={theme.colors.gold} />
          <AppText variant="bodyLarge" style={{ flex: 1 }}>
            {devotional.familyChallenge}
          </AppText>
        </View>
      </Card>

      <View style={{ marginTop: theme.spacing.xl }}>
        <CompleteActivityButton activity="devotional" day={day} />
      </View>
      <AppButton
        label="Write in our family journal"
        icon="create-outline"
        variant="ghost"
        onPress={() => router.push(`/journal?day=${day}`)}
        style={{ marginTop: theme.spacing.md }}
      />
    </Screen>
  );
}
