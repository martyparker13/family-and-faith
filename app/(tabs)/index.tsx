import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/AppButton';
import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { ExpandableCard } from '@/components/ExpandableCard';
import { BookMilestoneBadge } from '@/components/BookMilestoneBadge';
import { DisciplingTipBanner } from '@/components/DisciplingTipBanner';
import { MemoryVersePractice } from '@/components/MemoryVersePractice';
import { ProactiveGuidanceCard } from '@/components/ProactiveGuidanceCard';
import { ProgressBar } from '@/components/ProgressBar';
import { Screen } from '@/components/Screen';
import { SectionLabel } from '@/components/SectionLabel';
import { SlotStreakIndicators } from '@/components/SlotStreakIndicators';
import { StreakBadge } from '@/components/StreakBadge';
import { SundayBridgeCard } from '@/components/SundayBridgeCard';
import { getDevotional, getPlanDay, getPrayer } from '@/lib/content';
import { calendarDaysSinceStart, catchUpStatus, effectivePlanDay } from '@/lib/catch-up';
import { currentPlanDay, formatFriendlyDate, todayISO } from '@/lib/dates';
import { effectiveStreak, isVacationActive, shouldSuppressCatchUp } from '@/lib/vacation-mode';
import { memoryVerseForDay } from '@/lib/memory-verse';
import { buildParentPrep } from '@/lib/parent-prep';
import { prefetchUpcomingWeek } from '@/lib/prefetch';
import {
  currentRhythmSlot,
  orderedSlots,
  SLOT_LABELS,
  slotActivity,
  type RhythmSlot,
} from '@/lib/rhythm';
import { activeSeasonalOverlay, seasonalDayInfo } from '@/lib/seasonal';
import { isRecapDay } from '@/lib/weekly-recap';
import { useTheme } from '@/lib/theme-context';
import { allActivityDates, percentComplete, useProgress } from '@/store/progress';
import { useSettings } from '@/store/settings';

/**
 * The "Today" dashboard: time-aware rhythm hero, streaks, parent prep,
 * catch-up banner, seasonal overlay, and the three daily cards.
 */
export default function TodayScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const familyName = useSettings((s) => s.familyName);
  const planStartDate = useSettings((s) => s.planStartDate);
  const children = useSettings((s) => s.children);
  const catchUpChoice = useSettings((s) => s.catchUpChoice);
  const setCatchUpChoice = useSettings((s) => s.setCatchUpChoice);
  const seasonalEnabled = useSettings((s) => s.seasonalOverlaysEnabled);
  const vacationMode = useSettings((s) => s.vacationMode);

  const completedDays = useProgress((s) => s.completedDays);
  const devotionalDays = useProgress((s) => s.devotionalDays);
  const prayerDays = useProgress((s) => s.prayerDays);
  const slotCompletions = useProgress((s) => s.slotCompletions);

  const today = todayISO();
  const day = planStartDate
    ? effectivePlanDay(planStartDate, today, catchUpChoice)
    : planStartDate
      ? currentPlanDay(planStartDate, today)
      : 1;
  const plan = getPlanDay(day);
  const devotional = getDevotional(day);
  const prayer = getPrayer(day);
  const parentPrep = buildParentPrep(day, children);

  const activityDates = allActivityDates({ completedDays, devotionalDays, prayerDays });
  const streak = effectiveStreak(activityDates, today, vacationMode);
  const percent = percentComplete(completedDays);
  const onVacation = isVacationActive(vacationMode, today);
  const planDaySinceStart = planStartDate ? calendarDaysSinceStart(planStartDate, today) : 0;

  const currentSlot = currentRhythmSlot();
  const slots = orderedSlots(currentSlot);
  const nextSlot = slots.find(
    (s) => !Boolean(slotCompletions[s][day])
  ) ?? currentSlot;

  const catchUp = planStartDate
    ? catchUpStatus(
        planStartDate,
        today,
        { completedDays, devotionalDays, prayerDays },
        catchUpChoice
      )
    : null;
  const seasonal = activeSeasonalOverlay(today, seasonalEnabled);
  const seasonalInfo = seasonal ? seasonalDayInfo(seasonal, today) : null;

  useEffect(() => {
    prefetchUpcomingWeek(day);
  }, [day]);

  const greeting = familyName ? `Hello, ${familyName}!` : 'Hello, friends!';

  return (
    <Screen contentStyle={{ paddingTop: insets.top + theme.spacing.lg }}>
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
        <StreakBadge streak={streak} frozen={onVacation} />
      </View>

      {onVacation ? (
        <Card accent={theme.colors.blue} style={{ marginBottom: theme.spacing.md }}>
          <AppText variant="small" semiBold color={theme.colors.blue}>
            Vacation mode — reminders paused, streak frozen
          </AppText>
        </Card>
      ) : null}

      <DisciplingTipBanner planDaySinceStart={planDaySinceStart} />

      <BookMilestoneBadge />

      {seasonalInfo ? (
        <Card accent={theme.colors.gold} style={{ marginBottom: theme.spacing.md }}>
          <AppText variant="small" semiBold color={theme.colors.goldDeep}>
            {seasonalInfo.label}
          </AppText>
          {seasonalInfo.readingNote ? (
            <AppText variant="small" color={theme.colors.textMuted} style={{ marginTop: 4 }}>
              {seasonalInfo.readingNote}
            </AppText>
          ) : null}
        </Card>
      ) : null}

      {catchUp?.shouldOfferCatchUp && !shouldSuppressCatchUp(vacationMode, today) ? (
        <Card accent={theme.colors.clay} style={{ marginBottom: theme.spacing.md }}>
          <AppText variant="body" semiBold>
            Life got busy — pick up where you left off
          </AppText>
          <AppText variant="small" color={theme.colors.textMuted} style={{ marginTop: theme.spacing.xs }}>
            The calendar says day {catchUp.planDay}, but your last completed day is{' '}
            {catchUp.lastCompletedDay || 'none yet'}. No guilt — just choose what works today.
          </AppText>
          <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.md }}>
            <AppButton
              label="Continue today"
              variant="secondary"
              onPress={() => setCatchUpChoice('continue')}
              style={{ flex: 1 }}
            />
            <AppButton
              label="Today only"
              onPress={() => setCatchUpChoice('today-only')}
              style={{ flex: 1 }}
            />
          </View>
        </Card>
      ) : null}

      <UpNextHero slot={nextSlot} day={day} done={Boolean(slotCompletions[nextSlot][day])} />

      <View style={{ marginVertical: theme.spacing.md }}>
        <SlotStreakIndicators todayISO={today} />
      </View>

      <ExpandableCard
        eyebrow="Parent prep"
        eyebrowColor={theme.colors.goldDeep}
        title="Lead tonight’s family time"
        defaultOpen={false}
      >
        <AppText variant="body" semiBold>
          {parentPrep.bigIdea}
        </AppText>
        <AppText variant="small" color={theme.colors.textMuted} style={{ marginTop: theme.spacing.sm }}>
          Takeaway: {parentPrep.teachingPoint}
        </AppText>
        <AppText variant="body" style={{ marginTop: theme.spacing.md }}>
          {parentPrep.leadIn}
        </AppText>
        <AppText variant="small" semiBold color={theme.colors.green} style={{ marginTop: theme.spacing.sm }}>
          {parentPrep.questionHint}
        </AppText>
        {parentPrep.parentNoteTrigger ? (
          <View
            style={{
              marginTop: theme.spacing.md,
              paddingTop: theme.spacing.md,
              borderTopWidth: 1,
              borderTopColor: theme.colors.border,
            }}
          >
            <AppText variant="caption" bold scaled={false} color={theme.colors.clay}>
              SENSITIVE READING · {parentPrep.parentNoteTrigger.toUpperCase()}
            </AppText>
            <AppText variant="small" color={theme.colors.textMuted} style={{ marginTop: 4 }}>
              {parentPrep.parentNotePreview}
            </AppText>
          </View>
        ) : null}
      </ExpandableCard>

      <Pressable
        onPress={() => router.push(`/quick-evening?day=${day}`)}
        accessibilityRole="button"
        accessibilityLabel="Short on time? Try a five-minute family moment"
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: theme.spacing.sm,
          marginTop: theme.spacing.md,
          opacity: pressed ? 0.75 : 1,
        })}
      >
        <Ionicons name="timer-outline" size={18} color={theme.colors.goldDeep} />
        <AppText variant="small" semiBold color={theme.colors.goldDeep}>
          Short on time? 5-minute family moment →
        </AppText>
      </Pressable>

      <Card style={{ marginTop: theme.spacing.md }}>
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

      {isRecapDay(today) ? (
        <>
          <SundayBridgeCard todayISO={today} />
          <SectionLabel>Weekly recap</SectionLabel>
          <Card onPress={() => router.push('/recap')} accessibilityLabel="Open weekly recap">
            <AppText variant="body" semiBold>
              See this week together
            </AppText>
            <AppText variant="small" color={theme.colors.textMuted}>
              Readings, themes, journal entries, and answered prayers.
            </AppText>
          </Card>
        </>
      ) : null}

      <SectionLabel>Related guidance</SectionLabel>
      <ProactiveGuidanceCard day={day} />

      <SectionLabel>Today together</SectionLabel>

      <View style={{ gap: theme.spacing.md }}>
        {slots.map((slot) => (
          <RhythmDashboardCard
            key={slot}
            slot={slot}
            day={day}
            plan={plan}
            devotional={devotional}
            prayer={prayer}
            done={Boolean(slotCompletions[slot][day])}
            highlight={slot === nextSlot}
          />
        ))}
      </View>

      <SectionLabel>Memory verse of the week</SectionLabel>
      <MemoryVersePractice verse={memoryVerseForDay(day)} day={day} />

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

      <View style={{ flexDirection: 'row', gap: theme.spacing.md, marginTop: theme.spacing.md }}>
        <QuickLink
          icon="help-circle-outline"
          label="Kid Questions"
          onPress={() => router.push('/kid-questions')}
          hint="Questions children wondered during reading"
        />
      </View>
    </Screen>
  );
}

function UpNextHero({
  slot,
  day,
  done,
}: {
  slot: RhythmSlot;
  day: number;
  done: boolean;
}) {
  const theme = useTheme();
  const labels = SLOT_LABELS[slot];
  const activity = slotActivity(slot);

  return (
    <Card accent={theme.colors.gold}>
      <AppText variant="caption" bold scaled={false} color={theme.colors.goldDeep}>
        UP NEXT
      </AppText>
      <AppText variant="title" semiBold style={{ marginTop: theme.spacing.xs }}>
        {labels.title}
      </AppText>
      <AppText variant="small" color={theme.colors.textMuted}>
        {done ? 'Done for today — great work!' : `Day ${day} · ${activity}`}
      </AppText>
      {!done ? (
        <AppButton
          label={labels.startLabel}
          icon="play"
          onPress={() => router.push(`/rhythm/${slot}`)}
          style={{ marginTop: theme.spacing.md }}
        />
      ) : null}
    </Card>
  );
}

function RhythmDashboardCard({
  slot,
  day,
  plan,
  devotional,
  prayer,
  done,
  highlight,
}: {
  slot: RhythmSlot;
  day: number;
  plan: ReturnType<typeof getPlanDay>;
  devotional: ReturnType<typeof getDevotional>;
  prayer: ReturnType<typeof getPrayer>;
  done: boolean;
  highlight: boolean;
}) {
  const theme = useTheme();
  const labels = SLOT_LABELS[slot];
  const iconMap = { sunny: 'sunny', restaurant: 'restaurant', moon: 'moon' } as const;
  const accentMap = { morning: theme.colors.blue, dinner: theme.colors.clay, bedtime: theme.colors.green };

  const eyebrow = labels.short;
  const title =
    slot === 'morning'
      ? plan.passages.map((p) => p.reference).join('  •  ')
      : slot === 'dinner'
        ? devotional.title
        : prayer.title;
  const subtitle =
    slot === 'morning'
      ? plan.teachingPoint ?? plan.kidSummary
      : slot === 'dinner'
        ? devotional.scripture.reference
        : `A ${prayer.theme.toLowerCase()} prayer to pray aloud together`;

  const onPress = () => {
    if (slot === 'morning') router.push(`/day/${day}/reading`);
    else if (slot === 'dinner') router.push(`/day/${day}/devotional`);
    else router.push(`/day/${day}/prayer`);
  };

  return (
    <Card
      accent={accentMap[slot]}
      onPress={onPress}
      style={highlight ? { borderWidth: 2, borderColor: theme.colors.gold } : undefined}
      accessibilityLabel={`${eyebrow}: ${title}`}
      accessibilityHint="Opens the full screen"
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
        <Ionicons name={iconMap[labels.icon]} size={26} color={accentMap[slot]} />
        <AppText variant="caption" bold scaled={false} style={{ letterSpacing: 0.6, flex: 1 }}>
          {eyebrow.toUpperCase()}
        </AppText>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
          {slot === 'morning' && plan.parentNotes ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                backgroundColor: theme.colors.surfaceAlt,
                borderRadius: theme.radius.pill,
                paddingHorizontal: 8,
                paddingVertical: 2,
              }}
            >
              <Ionicons name="shield-checkmark-outline" size={14} color={theme.colors.clay} />
              <AppText variant="caption" semiBold scaled={false} color={theme.colors.clay}>
                Parent note
              </AppText>
            </View>
          ) : null}
          {done ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
              <AppText variant="caption" semiBold scaled={false} color={theme.colors.success}>
                Done
              </AppText>
            </View>
          ) : null}
        </View>
      </View>
      <AppText variant="title" semiBold style={{ marginTop: theme.spacing.sm }}>
        {title}
      </AppText>
      <AppText variant="small" color={theme.colors.textMuted} style={{ marginTop: theme.spacing.xs }}>
        {subtitle}
      </AppText>
      {!done ? (
        <Pressable
          onPress={() => router.push(`/rhythm/${slot}`)}
          style={{ marginTop: theme.spacing.sm }}
          accessibilityRole="button"
          accessibilityLabel={`Guided ${labels.short.toLowerCase()} flow`}
        >
          <AppText variant="small" semiBold color={theme.colors.goldDeep}>
            Guided flow →
          </AppText>
        </Pressable>
      ) : null}
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
