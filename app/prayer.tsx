import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { celebrationFor, celebrationHaptics, undoHaptics } from '@/lib/celebrate';
import { getPrayer } from '@/lib/content';
import { currentPlanDay, todayISO } from '@/lib/dates';
import { useTheme } from '@/lib/theme-context';
import { useCelebration } from '@/store/celebration';
import { todayContentIndex, useDailyContent } from '@/store/daily-content';
import { useFavorites } from '@/store/favorites';
import { useProgress } from '@/store/progress';
import { useSettings } from '@/store/settings';

export default function PrayerScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const [prayerMode, setPrayerMode] = useState(false);

  const contentIndex = useDailyContent(todayContentIndex);
  const prayerDoneDate = useDailyContent((s) => s.prayerDoneDate);
  const markPrayerDone = useDailyContent((s) => s.markPrayerDone);
  const unmarkPrayerDone = useDailyContent((s) => s.unmarkPrayerDone);
  const fire = useCelebration((s) => s.fire);

  const today = todayISO();
  const done = prayerDoneDate === today;

  const prayer = getPrayer(contentIndex);

  const favoriteId = `prayer-content-${contentIndex}`;
  const isFavorite = useFavorites((s) => s.favorites.some((f) => f.id === favoriteId));
  const toggleFavorite = useFavorites((s) => s.toggleFavorite);
  const toggleFavoritePrayer = () =>
    toggleFavorite({
      id: favoriteId,
      reference: prayer.title,
      text: [...prayer.lines, prayer.togetherLine].join('\n'),
      kind: 'prayer',
    });

  const handleToggle = () => {
    if (done) {
      unmarkPrayerDone();
      undoHaptics();
      return;
    }
    markPrayerDone(today);
    const progress = useProgress.getState();
    const daily = useDailyContent.getState();
    const planStartDate = useSettings.getState().planStartDate;
    const readingDay = planStartDate ? currentPlanDay(planStartDate, today) : 1;
    const celebration = celebrationFor(
      progress.completedDays,
      readingDay,
      Boolean(daily.devotionalDoneDate),
      true,
      [daily.devotionalDoneDate, today],
      today
    );
    fire(celebration);
    celebrationHaptics(celebration.size);
  };

  const textBump = prayerMode ? 1.18 : 1;

  return (
    <Screen
      style={prayerMode ? { backgroundColor: theme.scheme === 'dark' ? '#171209' : '#F6EDD9' } : undefined}
    >
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
          {t('prayer.pray_together_hint')}
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
          {t('prayer.all_together')}
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
            {prayerMode ? t('prayer.prayer_mode_exit') : t('prayer.prayer_mode_enter')}
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
              {isFavorite ? t('prayer.saved') : t('prayer.save')}
            </AppText>
          </Pressable>
        )}
      </View>

      {!prayerMode && (
        <>
          <View style={{ marginTop: theme.spacing.xl }}>
            <AppButton
              label={done ? t('prayer.completed_label') : t('prayer.mark_complete')}
              icon={done ? 'checkmark-circle' : 'ellipse-outline'}
              variant={done ? 'secondary' : 'primary'}
              onPress={handleToggle}
              accessibilityHint="Tracks this in your family's daily progress"
            />
          </View>
          <AppButton
            label={t('prayer.prayer_list_link')}
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
