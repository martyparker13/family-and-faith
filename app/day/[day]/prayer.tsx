import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { CompleteActivityButton } from '@/components/CompleteActivityButton';
import { DayNavigator } from '@/components/DayNavigator';
import { Screen } from '@/components/Screen';
import { getPrayer } from '@/lib/content';
import { useTheme } from '@/lib/theme-context';
import { prayerFavoriteId, useFavorites } from '@/store/favorites';

/**
 * Feature 3 — Daily Family Prayer screen.
 * Large, read-aloud-friendly layout with fill-in-the-blank moments and a
 * repeat-together closing line. "Prayer mode" dims the UI chrome and
 * enlarges the text for praying together.
 */
export default function PrayerScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ day: string }>();
  const day = Math.min(365, Math.max(1, parseInt(params.day ?? '1', 10) || 1));
  const prayer = getPrayer(day);
  const [prayerMode, setPrayerMode] = useState(false);

  // Saving a prayer stores only its day — the text itself is bundled content.
  const favoriteId = prayerFavoriteId(day);
  const isFavorite = useFavorites((s) => s.favorites.some((f) => f.id === favoriteId));
  const toggleFavorite = useFavorites((s) => s.toggleFavorite);
  const toggleFavoritePrayer = () =>
    toggleFavorite({
      id: favoriteId,
      reference: `${prayer.title} — Day ${day}`,
      text: [...prayer.lines, prayer.togetherLine].join('\n'),
      kind: 'prayer',
      day,
    });

  // Prayer mode: calmer background, larger type, no navigation chrome.
  const textBump = prayerMode ? 1.18 : 1;

  return (
    <Screen
      style={prayerMode ? { backgroundColor: theme.scheme === 'dark' ? '#171209' : '#F6EDD9' } : undefined}
    >
      {!prayerMode && (
        <DayNavigator
          day={day}
          subtitle={prayer.theme}
          onChange={(next) => router.setParams({ day: String(next) })}
        />
      )}

      <AppText
        variant="display"
        center
        accessibilityRole="header"
        style={{ marginTop: theme.spacing.xl }}
      >
        {prayer.title}
      </AppText>
      {!prayerMode && (
        <AppText variant="caption" center scaled={false} style={{ marginTop: theme.spacing.xs }}>
          Pray it aloud together — blanks are for each person to fill in!
        </AppText>
      )}

      {/* Prayer lines */}
      <View style={{ marginTop: theme.spacing.xl, gap: theme.spacing.lg }}>
        {prayer.lines.map((line, i) => {
          const isBlank = line.includes('______');
          return (
            <AppText
              key={i}
              variant="scripture"
              center
              color={isBlank ? theme.colors.goldDeep : theme.colors.text}
              style={{
                fontSize: theme.fontSizes.scripture * textBump,
                lineHeight: theme.lineHeights.scripture * textBump,
              }}
            >
              {line}
            </AppText>
          );
        })}
      </View>

      {/* Repeat-together closing */}
      <Card
        accent={theme.colors.green}
        style={{ marginTop: theme.spacing.xl, backgroundColor: theme.colors.surfaceAlt }}
      >
        <AppText variant="caption" bold center scaled={false} color={theme.colors.green}>
          ALL TOGETHER NOW
        </AppText>
        <AppText
          variant="title"
          serif
          semiBold
          center
          style={{
            marginTop: theme.spacing.sm,
            fontSize: theme.fontSizes.title * textBump,
            lineHeight: theme.lineHeights.title * textBump,
          }}
        >
          {prayer.togetherLine}
        </AppText>
      </Card>

      {/* Prayer mode toggle + save to favorites */}
      <View
        style={{
          marginTop: theme.spacing.xl,
          flexDirection: 'row',
          justifyContent: 'center',
          gap: theme.spacing.sm,
        }}
      >
        <Pressable
          onPress={() => setPrayerMode((m) => !m)}
          accessibilityRole="button"
          accessibilityLabel={prayerMode ? 'Exit prayer mode' : 'Enter prayer mode'}
          accessibilityHint="Prayer mode dims the screen and enlarges the prayer text"
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.spacing.sm,
            paddingHorizontal: theme.spacing.xl,
            minHeight: theme.minTouch,
            borderRadius: theme.radius.pill,
            borderWidth: 1,
            borderColor: theme.colors.border,
            backgroundColor: prayerMode ? theme.colors.gold : theme.colors.surface,
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <Ionicons
            name={prayerMode ? 'sunny' : 'moon'}
            size={20}
            color={prayerMode ? theme.colors.onAccent : theme.colors.goldDeep}
          />
          <AppText
            variant="small"
            semiBold
            scaled={false}
            color={prayerMode ? theme.colors.onAccent : theme.colors.text}
          >
            {prayerMode ? 'Exit prayer mode' : 'Prayer mode'}
          </AppText>
        </Pressable>

        {!prayerMode && (
          <Pressable
            onPress={toggleFavoritePrayer}
            accessibilityRole="button"
            accessibilityLabel={
              isFavorite ? 'Remove this prayer from favorites' : 'Save this prayer to favorites'
            }
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: theme.spacing.sm,
              paddingHorizontal: theme.spacing.xl,
              minHeight: theme.minTouch,
              borderRadius: theme.radius.pill,
              borderWidth: 1,
              borderColor: isFavorite ? theme.colors.clay : theme.colors.border,
              backgroundColor: theme.colors.surface,
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={20}
              color={isFavorite ? theme.colors.clay : theme.colors.textMuted}
            />
            <AppText variant="small" semiBold scaled={false}>
              {isFavorite ? 'Saved' : 'Save'}
            </AppText>
          </Pressable>
        )}
      </View>

      {!prayerMode && (
        <>
          <View style={{ marginTop: theme.spacing.xl }}>
            <CompleteActivityButton activity="prayer" day={day} />
          </View>
          <AppButton
            label="Our family prayer list"
            icon="list"
            variant="ghost"
            onPress={() => router.push('/prayer-list')}
            style={{ marginTop: theme.spacing.md }}
          />
        </>
      )}
    </Screen>
  );
}
