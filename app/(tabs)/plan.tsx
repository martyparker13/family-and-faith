import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo, useRef } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { ProgressBar } from '@/components/ProgressBar';
import { MAX_CONTENT_WIDTH } from '@/components/Screen';
import { useTranslation } from '@/i18n/context';
import { readingPlan, type PlanDay } from '@/lib/content';
import { currentPlanDay, dateForPlanDay, formatShortDate, todayISO } from '@/lib/dates';
import { useTheme } from '@/lib/theme-context';
import { percentComplete, useProgress } from '@/store/progress';
import { useSettings } from '@/store/settings';

const ROW_HEIGHT = 84;

/**
 * The full 365-day plan as a scrollable list, opened to today. Completed
 * days show a check; tapping any day opens its reading — perfect for
 * catching up on missed days or reading ahead.
 */
export default function PlanScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const planStartDate = useSettings((s) => s.planStartDate);
  const completedDays = useProgress((s) => s.completedDays);
  const listRef = useRef<FlatList<PlanDay>>(null);

  const today = planStartDate ? currentPlanDay(planStartDate, todayISO()) : 1;
  const percent = percentComplete(completedDays);
  const initialIndex = Math.max(0, today - 2);

  const getItemLayout = useMemo(
    () => (_: unknown, index: number) => ({
      length: ROW_HEIGHT,
      offset: ROW_HEIGHT * index,
      index,
    }),
    []
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View
        style={{
          paddingTop: insets.top + theme.spacing.lg,
          paddingHorizontal: theme.spacing.lg,
          paddingBottom: theme.spacing.md,
          width: '100%',
          maxWidth: MAX_CONTENT_WIDTH,
          alignSelf: 'center',
        }}
      >
        <AppText variant="heading" accessibilityRole="header" semiBold>
          {t('plan.title')}
        </AppText>
        <View style={{ marginTop: theme.spacing.md, gap: theme.spacing.xs }}>
          <ProgressBar percent={percent} />
          <AppText variant="caption" scaled={false}>
            {t('common.planProgress', {
              completed: Object.keys(completedDays).length,
              percent,
            })}
          </AppText>
        </View>
      </View>

      <FlatList
        ref={listRef}
        data={readingPlan}
        keyExtractor={(item) => String(item.day)}
        initialScrollIndex={initialIndex}
        getItemLayout={getItemLayout}
        onScrollToIndexFailed={(info) => {
          listRef.current?.scrollToOffset({
            offset: info.averageItemLength * info.index,
            animated: false,
          });
          setTimeout(() => {
            listRef.current?.scrollToIndex({ index: info.index, animated: false });
          }, 100);
        }}
        contentContainerStyle={{
          paddingBottom: insets.bottom + theme.spacing.xl,
          width: '100%',
          maxWidth: MAX_CONTENT_WIDTH,
          alignSelf: 'center',
        }}
        renderItem={({ item }) => (
          <DayRow
            item={item}
            isToday={item.day === today}
            done={Boolean(completedDays[item.day])}
            date={planStartDate ? formatShortDate(dateForPlanDay(planStartDate, item.day)) : ''}
          />
        )}
      />
    </View>
  );
}

function DayRow({
  item,
  isToday,
  done,
  date,
}: {
  item: PlanDay;
  isToday: boolean;
  done: boolean;
  date: string;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const references = item.passages.map((p) => p.reference).join(' and ');
  return (
    <Pressable
      onPress={() => router.push(`/day/${item.day}/reading`)}
      accessibilityRole="button"
      accessibilityLabel={t('common.planDayA11y', {
        day: item.day,
        completed: done ? t('common.planDayCompleted') : '',
        today: isToday ? t('common.planDayToday') : '',
        references,
      })}
      style={({ pressed }) => ({
        height: ROW_HEIGHT,
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        backgroundColor: pressed
          ? theme.colors.surfaceAlt
          : isToday
            ? theme.colors.surface
            : 'transparent',
        borderLeftWidth: isToday ? 4 : 0,
        borderLeftColor: theme.colors.gold,
      })}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: done ? theme.colors.green : theme.colors.surfaceAlt,
        }}
      >
        {done ? (
          <Ionicons name="checkmark" size={24} color={theme.colors.onAccent} />
        ) : (
          <AppText variant="small" bold scaled={false}>
            {item.day}
          </AppText>
        )}
      </View>
      <View style={{ flex: 1 }}>
        <AppText variant="body" semiBold scaled={false} numberOfLines={1}>
          {item.passages.map((p) => p.reference).join('  •  ')}
        </AppText>
        <AppText variant="caption" scaled={false} numberOfLines={1}>
          {isToday ? t('common.planTodayPrefix') : ''}
          {date}
        </AppText>
      </View>
      <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
    </Pressable>
  );
}
