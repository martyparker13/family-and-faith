import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect } from 'react';
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
import { currentPlanDay, formatFriendlyDate, todayISO } from '@/lib/dates';
import { memoryVerseForDay } from '@/lib/memory-verse';
import { prefetchUpcomingWeek } from '@/lib/prefetch';
import { useTheme } from '@/lib/theme-context';
import { useCelebration } from '@/store/celebration';
import { allActivityDates, currentStreak, percentComplete, useProgress } from '@/store/progress';
import { useSettings } from '@/store/settings';

/**
 * The "Today" dashboard: date, plan-day number, streak, and the three daily
 * cards (Reading, Devotional, Prayer), plus a prominent Scripture Guidance
 * entry point.
 */
export default function TodayScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const familyName = useSettings((s) => s.familyName);
  const planStartDate = useSettings((s) => s.planStartDate);
  const completedDays = useProgress((s) => s.completedDays);
  const devotionalDays = useProgress((s) => s.devotionalDays);
  const prayerDays = useProgress((s) => s.prayerDays);

  const today = todayISO();
  const day = planStartDate ? currentPlanDay(planStartDate, today) : 1;
  const plan = getPlanDay(day);
  const devotional = getDevotional(day);
  const prayer = getPrayer(day);

  const streak = currentStreak(
    allActivityDates({ completedDays, devotionalDays, prayerDays }),
    today
  );
  const percent = percentComplete(completedDays);

  // Quietly cache the coming week's chapters for offline reading.
  useEffect(() => {
    prefetchUpcomingWeek(day);
  }, [day]);

  const greeting = familyName ? `Hello, ${familyName}!` : 'Hello, friends!';

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
            Day {day} of 365
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
            Bible journey
          </AppText>
          <AppText variant="small" semiBold scaled={false} color={theme.colors.green}>
            {percent}% complete
          </AppText>
        </View>
        <ProgressBar percent={percent} />
      </Card>

      <SectionLabel>Today together</SectionLabel>

      <View style={{ gap: theme.spacing.md }}>
        <DashboardCard
          icon="book"
          accent={theme.colors.blue}
          eyebrow="Today's Reading"
          title={plan.passages.map((p) => p.reference).join('  •  ')}
          subtitle={plan.kidSummary}
          done={Boolean(completedDays[day])}
          onPress={() => router.push(`/day/${day}/reading`)}
        />
        <DashboardCard
          icon="chatbubbles"
          accent={theme.colors.clay}
          eyebrow="Today's Devotional"
          title={devotional.title}
          subtitle={devotional.scripture.reference}
          done={Boolean(devotionalDays[day])}
          onPress={() => router.push(`/day/${day}/devotional`)}
        />
        <DashboardCard
          icon="rose"
          accent={theme.colors.green}
          eyebrow="Today's Prayer"
          title={prayer.title}
          subtitle={`A ${prayer.theme.toLowerCase()} prayer to pray aloud together`}
          done={Boolean(prayerDays[day])}
          onPress={() => router.push(`/day/${day}/prayer`)}
        />
      </View>

      <SectionLabel>Memory verse of the week</SectionLabel>
      <MemoryVerseCard day={day} />

      <SectionLabel>Need guidance?</SectionLabel>
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
              Scripture Guidance
            </AppText>
            <AppText variant="small" color={theme.colors.textMuted}>
              Wisdom for whatever your family is facing — search any struggle.
            </AppText>
          </View>
          <Ionicons name="chevron-forward" size={22} color={theme.colors.textMuted} />
        </View>
      </Card>

      {/* Quick links: journal & prayer list */}
      <View style={{ flexDirection: 'row', gap: theme.spacing.md, marginTop: theme.spacing.lg }}>
        <QuickLink
          icon="create"
          label="Family Journal"
          onPress={() => router.push('/journal')}
          hint="One line a day about your family's journey"
        />
        <QuickLink
          icon="rose"
          label="Prayer List"
          onPress={() => router.push('/prayer-list')}
          hint="Requests and answered prayers"
        />
      </View>
    </Screen>
  );
}

/** This week's verse to hide in the family's hearts, with a practiced check. */
function MemoryVerseCard({ day }: { day: number }) {
  const theme = useTheme();
  const verse = memoryVerseForDay(day);
  const practiced = useProgress((s) => Boolean(s.practicedWeeks[verse.week]));
  const togglePracticed = useProgress((s) => s.togglePracticedWeek);
  const fire = useCelebration((s) => s.fire);

  const onPracticed = () => {
    togglePracticed(verse.week, todayISO());
    if (!practiced) {
      fire({ message: '📖 Hidden in your hearts!', size: 'small' });
      celebrationHaptics('small');
    }
  };

  return (
    <Card accent={theme.colors.blue}>
      <AppText variant="scripture" italic>
        “{verse.text}”
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
            {practiced ? 'Practiced!' : 'We practiced it'}
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
              Done
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
