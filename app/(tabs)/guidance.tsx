import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { SectionLabel } from '@/components/SectionLabel';
import { guidanceCategories, guidanceTopics } from '@/lib/content';
import { searchGuidance } from '@/lib/guidance-search';
import { useTheme } from '@/lib/theme-context';

/** Icons for each guidance category in the browse grid. */
const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Parenting: 'people',
  Marriage: 'heart-circle',
  'Conflict & Forgiveness': 'hand-left',
  'Fear & Anxiety': 'cloud',
  'Grief & Loss': 'flower',
  'Anger & Patience': 'thermometer',
  'Money & Provision': 'wallet',
  'Health & Healing': 'medkit',
  'Gratitude & Joy': 'sunny',
  'Friendship & Bullying': 'happy',
  'Discipline & Obedience': 'school',
  'Doubt & Faith': 'help-circle',
  'Big Life Changes': 'swap-horizontal',
  Loneliness: 'person',
  Temptation: 'shield-half',
  'Rest & Burnout': 'bed',
};

/**
 * Feature 4 — Scripture Guidance.
 * Type a real-life situation to get matching topics (fuzzy search), or
 * browse the full topic grid by category.
 */
export default function GuidanceScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');

  const matches = useMemo(() => searchGuidance(query), [query]);
  const searching = query.trim().length >= 2;

  return (
    <Screen contentStyle={{ paddingTop: insets.top + theme.spacing.lg }}>
      <AppText variant="heading" semiBold accessibilityRole="header">
        Scripture Guidance
      </AppText>
      <AppText variant="small" color={theme.colors.textMuted} style={{ marginTop: 2 }}>
        Whatever your family is facing, God’s word has something to say.
      </AppText>

      {/* Search box */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.spacing.sm,
          marginTop: theme.spacing.lg,
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.pill,
          paddingHorizontal: theme.spacing.lg,
          minHeight: theme.minTouch + 6,
        }}
      >
        <Ionicons name="search" size={22} color={theme.colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder='Try "my kids keep fighting"…'
          placeholderTextColor={theme.colors.textMuted}
          accessibilityLabel="Search for guidance"
          accessibilityHint="Describe a situation in your own words"
          autoCorrect={false}
          style={{
            flex: 1,
            color: theme.colors.text,
            fontFamily: theme.fonts.sans,
            fontSize: theme.fontSizes.body,
            minHeight: theme.minTouch,
          }}
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery('')} accessibilityLabel="Clear search" hitSlop={10}>
            <Ionicons name="close-circle" size={22} color={theme.colors.textMuted} />
          </Pressable>
        )}
      </View>

      {searching ? (
        <>
          <SectionLabel>
            {matches.length > 0 ? 'Where God meets you' : 'No matches found'}
          </SectionLabel>
          {matches.length === 0 ? (
            <AppText variant="body" color={theme.colors.textMuted}>
              Try different words — or browse the topics below. Every topic is full of scripture
              for real life.
            </AppText>
          ) : (
            <View style={{ gap: theme.spacing.md }}>
              {matches.map(({ topic }) => (
                <Card
                  key={topic.id}
                  accent={theme.colors.gold}
                  onPress={() => router.push(`/guidance/${topic.id}`)}
                  accessibilityLabel={topic.name}
                  accessibilityHint="Opens scripture and encouragement for this topic"
                >
                  <AppText variant="caption" bold scaled={false} color={theme.colors.goldDeep}>
                    {topic.category.toUpperCase()}
                  </AppText>
                  <AppText variant="title" semiBold style={{ marginTop: 2 }}>
                    {topic.name}
                  </AppText>
                  <AppText
                    variant="small"
                    color={theme.colors.textMuted}
                    numberOfLines={2}
                    style={{ marginTop: theme.spacing.xs }}
                  >
                    {topic.note}
                  </AppText>
                </Card>
              ))}
            </View>
          )}
        </>
      ) : (
        <>
          <SectionLabel>Browse topics</SectionLabel>
          {guidanceCategories.map((category) => (
            <View key={category} style={{ marginBottom: theme.spacing.lg }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: theme.spacing.sm,
                  marginBottom: theme.spacing.sm,
                }}
              >
                <Ionicons
                  name={CATEGORY_ICONS[category] ?? 'book'}
                  size={18}
                  color={theme.colors.goldDeep}
                />
                <AppText variant="body" bold scaled={false}>
                  {category}
                </AppText>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
                {guidanceTopics
                  .filter((t) => t.category === category)
                  .map((topic) => (
                    <Pressable
                      key={topic.id}
                      onPress={() => router.push(`/guidance/${topic.id}`)}
                      accessibilityRole="button"
                      accessibilityLabel={topic.name}
                      style={({ pressed }) => ({
                        backgroundColor: pressed ? theme.colors.surfaceAlt : theme.colors.surface,
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                        borderRadius: theme.radius.pill,
                        paddingHorizontal: theme.spacing.lg,
                        paddingVertical: theme.spacing.md,
                        minHeight: theme.minTouch - 4,
                        justifyContent: 'center',
                      })}
                    >
                      <AppText variant="small" semiBold scaled={false}>
                        {topic.name}
                      </AppText>
                    </Pressable>
                  ))}
              </View>
            </View>
          ))}
        </>
      )}
    </Screen>
  );
}
