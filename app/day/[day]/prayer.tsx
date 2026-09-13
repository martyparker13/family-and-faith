import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Animated, Pressable, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { ParentTipBanner } from '@/components/ParentTipBanner';
import { CompleteActivityButton } from '@/components/CompleteActivityButton';
import { DayNavigator } from '@/components/DayNavigator';
import { Screen } from '@/components/Screen';
import { SectionLabel } from '@/components/SectionLabel';
import { getPrayer } from '@/lib/content';
import { useTheme } from '@/lib/theme-context';
import { prayerFavoriteId, useFavorites } from '@/store/favorites';
import { useProgress } from '@/store/progress';
import { useSettings } from '@/store/settings';
import { useTranslation } from '@/i18n/context';

/**
 * Feature 3 — Daily Family Prayer screen.
 * Large, read-aloud-friendly layout with fill-in-the-blank moments and a
 * repeat-together closing line. "Prayer mode" dims the UI chrome and
 * enlarges the text for praying together.
 */
export default function PrayerScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ day: string }>();
  const day = Math.min(365, Math.max(1, parseInt(params.day ?? '1', 10) || 1));
  const prayer = getPrayer(day);
  const [prayerMode, setPrayerMode] = useState(false);
  const children = useSettings((s) => s.children);
  const participation = useProgress((s) => s.prayerParticipation[day]);
  const recordPrayerTap = useProgress((s) => s.recordPrayerTap);
  const [pulse] = useState(() => new Animated.Value(1));

  const onKidTap = (childId?: string) => {
    recordPrayerTap(day, childId);
    Animated.sequence([
      Animated.timing(pulse, { toValue: 1.08, duration: 120, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
  };

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
        <>
          <DayNavigator
            day={day}
            subtitle={prayer.theme}
            onChange={(next) => router.setParams({ day: String(next) })}
          />
          <ParentTipBanner screen="prayer" day={day} />
        </>
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
          {t('prayer.prayAloudHint')}
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

      <SectionLabel color={theme.colors.green}>{t('prayer.kidsTapSection')}</SectionLabel>
      <Animated.View style={{ transform: [{ scale: pulse }] }}>
        <Card accent={theme.colors.green}>
          {children.length > 0 ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
              {children.map((child, i) => (
                <AppButton
                  key={`child-${i}`}
                  label={child.name ?? t('common.child', { index: i + 1 })}
                  icon="hand-left-outline"
                  variant="secondary"
                  onPress={() => onKidTap(String(i))}
                />
              ))}
            </View>
          ) : (
            <AppButton
              label={t('common.readyTaps', { count: participation?.taps ?? 0 })}
              icon="hand-left-outline"
              onPress={() => onKidTap()}
            />
          )}
          {(participation?.taps ?? 0) > 0 ? (
            <AppText variant="small" color={theme.colors.textMuted} style={{ marginTop: theme.spacing.sm }}>
              {t('common.tapsToday', {
                count: participation?.taps ?? 0,
                plural: (participation?.taps ?? 0) === 1 ? '' : 's',
              })}
            </AppText>
          ) : null}
        </Card>
      </Animated.View>

      {/* Repeat-together closing */}
      <Card
        accent={theme.colors.green}
        style={{ marginTop: theme.spacing.xl, backgroundColor: theme.colors.surfaceAlt }}
      >
        <AppText variant="caption" bold center scaled={false} color={theme.colors.green}>
          {t('prayer.allTogether')}
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
          accessibilityLabel={prayerMode ? t('common.exitPrayerMode') : t('common.enterPrayerMode')}
          accessibilityHint={t('common.prayerModeHint')}
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
            {prayerMode ? t('common.exitPrayerMode') : t('common.enterPrayerMode')}
          </AppText>
        </Pressable>

        {!prayerMode && (
          <Pressable
            onPress={toggleFavoritePrayer}
            accessibilityRole="button"
            accessibilityLabel={
              isFavorite ? t('common.removePrayerFavorite') : t('common.savePrayerFavorite')
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
              {isFavorite ? t('common.savedPrayer') : t('common.savePrayer')}
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
            label={t('common.ourPrayerList')}
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
