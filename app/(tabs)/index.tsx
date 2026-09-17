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
import { proactiveGuidanceForDay } from '@/lib/proactive-guidance';
import { effectiveStreak, isVacationActive, shouldSuppressCatchUp } from '@/lib/vacation-mode';
import { memoryVerseForDay } from '@/lib/memory-verse';
import { buildParentPrep } from '@/lib/parent-prep';
import { prefetchUpcomingWeek } from '@/lib/prefetch';
import {
  currentRhythmSlot,
  orderedSlots,
  getSlotLabels,
  slotActivity,
  type RhythmSlot,
} from '@/lib/rhythm';
import { activeSeasonalOverlay, seasonalDayInfo } from '@/lib/seasonal';
import { isRecapDay } from '@/lib/weekly-recap';
import { useTranslation } from '@/i18n/context';
import { useTheme } from '@/lib/theme-context';
import { allActivityDates, percentComplete, useProgress } from '@/store/progress';
import { useSettings } from '@/store/settings';

/**
 * The "Today" dashboard: time-aware rhythm hero, streaks, parent prep,
 * catch-up banner, seasonal overlay, and the three daily cards.
 */
export default function TodayScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
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
  const guidanceMatch = proactiveGuidanceForDay(day);

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

  const greeting = familyName
    ? t('today.greetingNamed', { name: familyName })
    : t('today.greetingDefault');

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
            {t('common.dayOf365', { day })}
          </AppText>
        </View>
        <StreakBadge streak={streak} frozen={onVacation} />
      </View>

      {onVacation ? (
        <Card accent={theme.colors.blue} style={{ marginBottom: theme.spacing.md }}>
          <AppText variant="small" semiBold color={theme.colors.blue}>
            {t('today.vacationBanner')}
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
            {t('today.catchUpTitle')}
          </AppText>
          <AppText variant="small" color={theme.colors.textMuted} style={{ marginTop: theme.spacing.xs }}>
            {t('today.catchUpBody', {
              planDay: catchUp.planDay,
              lastDay: catchUp.lastCompletedDay || t('common.noneYet'),
            })}
          </AppText>
          <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.md }}>
            <AppButton
              label={t('today.continueToday')}
              variant="secondary"
              onPress={() => setCatchUpChoice('continue')}
              style={{ flex: 1 }}
            />
            <AppButton
              label={t('today.todayOnly')}
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
        eyebrow={t('today.parentPrepEyebrow')}
        eyebrowColor={theme.colors.goldDeep}
        title={t('today.parentPrepTitle')}
        defaultOpen={false}
      >
        <AppText variant="body" semiBold>
          {parentPrep.bigIdea}
        </AppText>
        <AppText variant="small" color={theme.colors.textMuted} style={{ marginTop: theme.spacing.sm }}>
          {t('common.takeawayPrefix', { point: parentPrep.teachingPoint })}
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
              {t('common.sensitiveReading', { trigger: parentPrep.parentNoteTrigger.toUpperCase() })}
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
        accessibilityLabel={t('common.shortOnTimeA11y')}
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
          {t('common.shortOnTimeLink')}
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
            {t('today.bibleJourney')}
          </AppText>
          <AppText variant="small" semiBold scaled={false} color={theme.colors.green}>
            {t('common.percentComplete', { percent })}
          </AppText>
        </View>
        <ProgressBar percent={percent} />
      </Card>

      {isRecapDay(today) ? (
        <>
          <SundayBridgeCard todayISO={today} />
          <SectionLabel>{t('today.weeklyRecapSection')}</SectionLabel>
          <Card onPress={() => router.push('/recap')} accessibilityLabel={t('common.openWeeklyRecap')}>
            <AppText variant="body" semiBold>
              {t('today.weeklyRecapTitle')}
            </AppText>
            <AppText variant="small" color={theme.colors.textMuted}>
              {t('today.weeklyRecapSubtitle')}
            </AppText>
          </Card>
        </>
      ) : null}

      {guidanceMatch ? (
        <>
          <SectionLabel>{t('today.relatedGuidanceSection')}</SectionLabel>
          <ProactiveGuidanceCard day={day} />
        </>
      ) : null}

      <SectionLabel>{t('today.todayTogetherSection')}</SectionLabel>

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

      <SectionLabel>{t('today.memoryVerseSection')}</SectionLabel>
      <MemoryVersePractice verse={memoryVerseForDay(day)} day={day} />

      <SectionLabel>{t('today.needGuidanceSection')}</SectionLabel>
      <Card
        accent={theme.colors.gold}
        onPress={() => router.push('/guidance')}
        accessibilityLabel={t('today.scriptureGuidanceTitle')}
        accessibilityHint={t('common.scriptureGuidanceHint')}
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
              {t('today.scriptureGuidanceTitle')}
            </AppText>
            <AppText variant="small" color={theme.colors.textMuted}>
              {t('today.scriptureGuidanceSubtitle')}
            </AppText>
          </View>
          <Ionicons name="chevron-forward" size={22} color={theme.colors.textMuted} />
        </View>
      </Card>

      <View style={{ flexDirection: 'row', gap: theme.spacing.md, marginTop: theme.spacing.lg }}>
        <QuickLink
          icon="create"
          label={t('today.familyJournal')}
          onPress={() => router.push('/journal')}
          hint={t('today.familyJournalHint')}
        />
        <QuickLink
          icon="rose"
          label={t('today.prayerList')}
          onPress={() => router.push('/prayer-list')}
          hint={t('today.prayerListHint')}
        />
      </View>

      <View style={{ flexDirection: 'row', gap: theme.spacing.md, marginTop: theme.spacing.md }}>
        <QuickLink
          icon="help-circle-outline"
          label={t('today.kidQuestions')}
          onPress={() => router.push('/kid-questions')}
          hint={t('today.kidQuestionsHint')}
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
  const { t } = useTranslation();
  const labels = getSlotLabels(slot);
  const activity = slotActivity(slot);

  return (
    <Card accent={theme.colors.gold}>
      <AppText variant="caption" bold scaled={false} color={theme.colors.goldDeep}>
        {t('common.upNext')}
      </AppText>
      <AppText variant="title" semiBold style={{ marginTop: theme.spacing.xs }}>
        {labels.title}
      </AppText>
      <AppText variant="small" color={theme.colors.textMuted}>
        {done
          ? t('common.doneForToday')
          : t('common.dayActivity', { day, activity: t(`activities.${activity}`) })}
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
  const { t } = useTranslation();
  const labels = getSlotLabels(slot);
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
        : t('common.prayerSubtitle', { theme: prayer.theme.toLowerCase() });

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
      accessibilityHint={t('common.opensFullScreen')}
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
                {t('common.parentNote')}
              </AppText>
            </View>
          ) : null}
          {done ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
              <AppText variant="caption" semiBold scaled={false} color={theme.colors.success}>
                {t('common.done')}
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
          accessibilityLabel={t('common.guidedFlowA11y', { slot: labels.short.toLowerCase() })}
        >
          <AppText variant="small" semiBold color={theme.colors.goldDeep}>
            {t('common.guidedFlow')}
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
