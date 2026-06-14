import { Stack, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { SectionLabel } from '@/components/SectionLabel';
import { VerseCard } from '@/components/VerseCard';
import { getGuidanceTopic } from '@/lib/content';
import { useTheme } from '@/lib/theme-context';

/**
 * Guidance topic results: the pastoral note followed by scripture cards
 * (WEB text) that can be favorited, copied, or shared.
 */
export default function GuidanceTopicScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const topic = id ? getGuidanceTopic(id) : undefined;

  if (!topic) {
    return (
      <Screen>
        <EmptyState
          icon="compass-outline"
          title="Topic not found"
          message="This topic seems to be missing. Head back and try another."
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: topic.category }} />

      <AppText
        variant="display"
        accessibilityRole="header"
        style={{ marginTop: theme.spacing.lg }}
      >
        {topic.name}
      </AppText>

      {/* Pastoral note */}
      <Card accent={theme.colors.green} style={{ marginTop: theme.spacing.lg }}>
        <AppText variant="caption" bold scaled={false} color={theme.colors.green}>
          A WORD OF ENCOURAGEMENT
        </AppText>
        <AppText variant="bodyLarge" style={{ marginTop: theme.spacing.sm }}>
          {topic.note}
        </AppText>
      </Card>

      <SectionLabel>What God’s word says</SectionLabel>
      <View style={{ gap: theme.spacing.md }}>
        {topic.verses.map((verse) => (
          <VerseCard
            key={verse.reference}
            reference={verse.reference}
            text={verse.text}
            topic={topic.name}
          />
        ))}
      </View>

      <AppText variant="caption" center style={{ marginTop: theme.spacing.xl }}>
        Tap the heart to keep a verse in your Favorites.
      </AppText>
    </Screen>
  );
}
