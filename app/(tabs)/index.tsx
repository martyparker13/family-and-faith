import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { ProgressBar } from '@/components/ProgressBar';
import { Screen } from '@/components/Screen';
import { SectionLabel } from '@/components/SectionLabel';
import { StreakBadge } from '@/components/StreakBadge';
import { getDevotional, getPlanDay, getPrayer } from '@/lib/content';
import { celebrationHaptics } from '@/lib/celebrate';
import { syncWidget } from '@/lib/widget-sync';
import { currentPlanDay, formatFriendlyDate, todayISO } from '@/lib/dates';
import { memoryVerseForDay } from '@/lib/memory-verse';
import { prefetchUpcomingWeek } from '@/lib/prefetch';
import { useTheme } from '@/lib/theme-context';
import { useCelebration } from '@/store/celebration';
import { todayContentIndex, useDailyContent } from '@/store/daily-content';
import { allActivityDates, currentStreak, percentComplete, useProgress } from '@/store/progress';
import { useSettings } from '@/store/settings';

/** First incomplete reading day >= `from`, capped at 365. */
function activeReadingDay(completed: Record<number, string>, from: number): number {
  let d = from;
  while (d < 365 && completed[d]) d++;
  return d;
}

export default function TodayScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const familyName = useSettings((s) => s.familyName);
  const planStartDate = useSettings((s) => s.planStartDate);
  const completedDays = useProgress((s) => s.completedDays);

  const contentIndex = useDailyContent(todayContentIndex);
  const devotionalDoneDate = useDailyContent((s) => s.devotionalDoneDate);
  const prayerDoneDate = useDailyContent((s) => s.prayerDoneDate);
  const lastAdvancedDate = useDailyContent((s) => s.lastAdvancedDate);
  const advance = useDailyContent((s) => s.advance);

  const today = todayISO();
  const day = planStartDate ? currentPlanDay(planStartDate, today) : 1;
  const readingDay = activeReadingDay(completedDays, day);

  // Advance to today's devotional/prayer if the date has changed (midnight rollover).
  useEffect(() => {
    if (lastAdvancedDate !== today) advance(today);
  }, [today, lastAdvancedDate, advance]);

  const plan = getPlanDay(readingDay);
  const devotional = getDevotional(contentIndex);
  const prayer = getPrayer(contentIndex);

  const streak = currentStreak(
    allActivityDates(completedDays, [devotionalDoneDate, prayerDoneDate]),
    today
  );
  const percent = percentComplete(completedDays);

  const devotionalDone = devotionalDoneDate === today;
  const prayerDone = prayerDoneDate === today;

  useEffect(() => {
    prefetchUpcomingWeek(readingDay);
  }, [readingDay]);

  useEffect(() => {
    syncWidget({
      day,
      readingDone: Boolean(completedDays[readingDay]),
      devotionalDone,
      prayerDone,
    });
  }, [day, readingDay, completedDays, devotionalDone, prayerDone]);

  const greeting = familyName
    ? t('today.greeting_name', { name: familyName })
    : t('today.greeting_default');

  return (
    <Screen contentStyle={{ paddingTop: insets.top + theme.spacing.lg }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: theme.spacing.lg,
        }}
      >
        <View style={{ flex: 1, paddingRight: theme.spacing.md }}>
          <AppText variant="caption" semiBold scaled={false}>
            {formatFriendlyDate(new Date())}
          </AppText>
          <AppText variant="display" accessibilityRole="header">
            {greeting}
          </AppText>
          <AppText variant="small" color={theme.colors.goldDeep} semiBold scaled={false}>
            {t('common.day_of_365', { day })}
          </AppText>
        </View>
        <StreakBadge streak={streak} />
      </View>

      {/* Progress through the Bible */}
      <Card>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: theme.spacing.sm,
          }}
        >
          <AppText variant="small" semiBold scaled={false}>
            {t('today.bible_journey')}
          </AppText>
          <AppText variant="small" semiBold scaled={false} color={theme.colors.green}>
            {t('common.percent_complete', { percent })}
          </AppText>
        </View>
        <ProgressBar percent={percent} />
      </Card>

      <SectionLabel>{t('today.today_together')}</SectionLabel>

      <View style={{ gap: theme.spacing.md }}>
        <DashboardCard
          icon="book"
          accent={theme.colors.blue}
          eyebrow={readingDay === day
            ? t('today.eyebrow_reading_today')
            : t('today.eyebrow_reading_day', { day: readingDay })}
          title={plan.passages.map((p) => p.reference).join('  •  ')}
          subtitle={plan.kidSummary}
          done={Boolean(completedDays[readingDay])}
          onPress={() => router.push(`/day/${readingDay}/reading`)}
        />
        <DashboardCard
          icon="chatbubbles"
          accent={theme.colors.clay}
          eyebrow={t('today.eyebrow_devotional_today')}
          title={devotional.title}
          subtitle={devotional.scripture.reference}
          done={devotionalDone}
          onPress={() => router.push('/devotional')}
        />
        <DashboardCard
          icon="rose"
          accent={theme.colors.green}
          eyebrow={t('today.eyebrow_prayer_today')}
          title={prayer.title}
          subtitle={`A ${prayer.theme.toLowerCase()} prayer to pray aloud together`}
          done={prayerDone}
          onPress={() => router.push('/prayer')}
        />
      </View>

      <SectionLabel>{t('today.memory_verse')}</SectionLabel>
      <MemoryVerseCard day={day} />

      <SectionLabel>{t('today.need_guidance')}</SectionLabel>
      <Card
        accent={theme.colors.gold}
        onPress={() => router.push('/guidance')}
        accessibilityLabel="Scripture Guidance"
        accessibilityHint="Search the Bible for help with life's struggles"
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.lg }}>
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 26,
              backgroundColor: theme.colors.surfaceAlt,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="compass" size={28} color={theme.colors.goldDeep} />
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="title" semiBold>
              {t('today.guidance_title')}
            </AppText>
            <AppText variant="small" color={theme.colors.textMuted}>
              {t('today.guidance_subtitle')}
            </AppText>
          </View>
          <Ionicons name="chevron-forward" size={22} color={theme.colors.textMuted} />
        </View>
      </Card>

      {/* Quick links: journal & prayer list */}
      <View style={{ flexDirection: 'row', gap: theme.spacing.md, marginTop: theme.spacing.lg }}>
        <QuickLink
          icon="create"
          label={t('today.journal')}
          onPress={() => router.push('/journal')}
          hint={t('today.journal_hint')}
        />
        <QuickLink
          icon="rose"
          label={t('today.prayer_list')}
          onPress={() => router.push('/prayer-list')}
          hint={t('today.prayer_list_hint')}
        />
      </View>
    </Screen>
  );
}

function MemoryVerseCard({ day }: { day: number }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const verse = memoryVerseForDay(day);
  const practiced = useProgress((s) => Boolean(s.practicedWeeks[verse.week]));
  const togglePracticed = useProgress((s) => s.togglePracticedWeek);
  const fire = useCelebration((s) => s.fire);

  const onPracticed = () => {
    togglePracticed(verse.week, todayISO());
    if (!practiced) {
      fire({ message: t('today.hidden_in_hearts'), size: 'small' });
      celebrationHaptics('small');
    }
  };

  return (
    <Card accent={theme.colors.blue}>
      <AppText variant="scripture" italic>
        "{verse.text}"
      </AppText>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: theme.spacing.md,
        }}
      >
        <AppText variant="small" semiBold color={theme.colors.goldDeep} style={{ flex: 1 }}>
          {verse.reference}
        </AppText>
        <Pressable
          onPress={onPracticed}
          accessibilityRole="button"
          accessibilityLabel={
            practiced ? 'Practiced this week — tap to undo' : 'Mark memory verse as practiced'
          }
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            borderWidth: 1,
            borderColor: practiced ? theme.colors.green : theme.colors.border,
            backgroundColor: practiced
              ? theme.colors.surfaceAlt
              : pressed
                ? theme.colors.surfaceAlt
                : 'transparent',
            borderRadius: theme.radius.pill,
            paddingHorizontal: theme.spacing.md,
            minHeight: theme.minTouch - 8,
          })}
        >
          <Ionicons
            name={practiced ? 'checkmark-circle' : 'mic-outline'}
            size={18}
            color={practiced ? theme.colors.green : theme.colors.textMuted}
          />
          <AppText
            variant="small"
            semiBold
            scaled={false}
            color={practiced ? theme.colors.green : theme.colors.text}
          >
            {practiced ? t('today.practiced') : t('today.we_practiced')}
          </AppText>
        </Pressable>
      </View>
    </Card>
  );
}

function QuickLink({
  icon,
  label,
  hint,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  hint: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Card
      onPress={onPress}
      style={{ flex: 1 }}
      accessibilityLabel={label}
      accessibilityHint={hint}
    >
      <Ionicons name={icon} size={24} color={theme.colors.goldDeep} />
      <AppText variant="body" semiBold scaled={false} style={{ marginTop: theme.spacing.sm }}>
        {label}
      </AppText>
    </Card>
  );
}

function DashboardCard({
  icon,
  accent,
  eyebrow,
  title,
  subtitle,
  done,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  accent: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  done?: boolean;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  return (
    <Card
      accent={accent}
      onPress={onPress}
      accessibilityLabel={`${eyebrow}: ${title}`}
      accessibilityHint="Opens the full screen"
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
        <Ionicons name={icon} size={26} color={accent} />
        <AppText variant="caption" bold scaled={false} style={{ letterSpacing: 0.6, flex: 1 }}>
          {eyebrow.toUpperCase()}
        </AppText>
        {done ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
            <AppText variant="caption" semiBold scaled={false} color={theme.colors.success}>
              {t('common.done')}
            </AppText>
          </View>
        ) : null}
      </View>
      <AppText variant="title" semiBold style={{ marginTop: theme.spacing.sm }}>
        {title}
      </AppText>
      <AppText
        variant="small"
        color={theme.colors.textMuted}
        style={{ marginTop: theme.spacing.xs }}
      >
        {subtitle}
      </AppText>
    </Card>
  );
}
