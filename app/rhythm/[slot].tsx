import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { MemoryVersePractice } from '@/components/MemoryVersePractice';
import { Screen } from '@/components/Screen';
import { useTranslation } from '@/i18n/context';
import { getDevotional, getPlanDay, getPrayer } from '@/lib/content';
import { celebrationHaptics } from '@/lib/celebrate';
import { effectivePlanDay } from '@/lib/catch-up';
import { todayISO } from '@/lib/dates';
import { memoryVerseForDay } from '@/lib/memory-verse';
import {
  getSlotLabels,
  slotActivity,
  type RhythmSlot,
} from '@/lib/rhythm';
import { useTheme } from '@/lib/theme-context';
import { useCelebration } from '@/store/celebration';
import { useProgress } from '@/store/progress';
import { useSettings } from '@/store/settings';

const VALID_SLOTS: RhythmSlot[] = ['morning', 'dinner', 'bedtime'];

type FlowStep = 'intro' | 'content' | 'memory' | 'done';

/**
 * Guided rhythm flow — morning reading + memory verse, dinner devotional,
 * or bedtime prayer, ending with slot completion celebration.
 */
export default function RhythmFlowScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ slot: string }>();
  const slot = (VALID_SLOTS.includes(params.slot as RhythmSlot)
    ? params.slot
    : 'morning') as RhythmSlot;

  const planStartDate = useSettings((s) => s.planStartDate);
  const catchUpChoice = useSettings((s) => s.catchUpChoice);
  const today = todayISO();
  const day = planStartDate
    ? effectivePlanDay(planStartDate, today, catchUpChoice)
    : 1;

  const plan = getPlanDay(day);
  const devotional = getDevotional(day);
  const prayer = getPrayer(day);
  const verse = memoryVerseForDay(day);
  const labels = getSlotLabels(slot);

  const markSlotComplete = useProgress((s) => s.markSlotComplete);
  const fire = useCelebration((s) => s.fire);

  const [step, setStep] = useState<FlowStep>('intro');

  const finish = () => {
    markSlotComplete(slot, day, today);
    fire({ message: t('common.rhythmDoneCelebration', { slot: labels.short }), size: 'small' });
    celebrationHaptics('small');
    setStep('done');
  };

  const openFullScreen = () => {
    const activity = slotActivity(slot);
    if (activity === 'reading') router.push(`/day/${day}/reading`);
    else if (activity === 'devotional') router.push(`/day/${day}/devotional`);
    else router.push(`/day/${day}/prayer`);
  };

  const introText =
    slot === 'morning'
      ? t('rhythm.introMorning')
      : slot === 'dinner'
        ? t('rhythm.introDinner')
        : t('rhythm.introBedtime');

  return (
    <Screen>
      <View style={{ alignItems: 'center', marginBottom: theme.spacing.lg }}>
        <Ionicons name={labels.icon} size={40} color={theme.colors.goldDeep} />
        <AppText variant="display" center accessibilityRole="header">
          {labels.title}
        </AppText>
        <AppText variant="small" color={theme.colors.textMuted} center>
          {t('common.dayLabel', { day })}
        </AppText>
      </View>

      {step === 'intro' ? (
        <Card accent={theme.colors.gold}>
          <AppText variant="bodyLarge">{introText}</AppText>
          <AppButton
            label={labels.startLabel}
            icon="play"
            onPress={() => setStep('content')}
            style={{ marginTop: theme.spacing.lg }}
          />
        </Card>
      ) : null}

      {step === 'content' && slot === 'morning' ? (
        <>
          <Card accent={theme.colors.blue}>
            <AppText variant="caption" bold scaled={false} color={theme.colors.goldDeep}>
              {t('reading.todaysReading')}
            </AppText>
            <AppText variant="title" semiBold style={{ marginTop: theme.spacing.sm }}>
              {plan.passages.map((p) => p.reference).join(' · ')}
            </AppText>
            <AppText variant="body" style={{ marginTop: theme.spacing.sm }}>
              {plan.teachingPoint ?? plan.kidSummary}
            </AppText>
          </Card>
          <AppButton
            label={t('common.openFullReading')}
            variant="secondary"
            onPress={openFullScreen}
            style={{ marginTop: theme.spacing.md }}
          />
          <AppButton
            label={t('common.nextMemoryVerse')}
            onPress={() => setStep('memory')}
            style={{ marginTop: theme.spacing.md }}
          />
        </>
      ) : null}

      {step === 'memory' && slot === 'morning' ? (
        <>
          <MemoryVersePractice verse={verse} day={day} />
          <AppButton
            label={t('common.markMorningDone')}
            icon="checkmark"
            onPress={finish}
            style={{ marginTop: theme.spacing.lg }}
          />
        </>
      ) : null}

      {step === 'content' && slot === 'dinner' ? (
        <>
          <Card accent={theme.colors.clay}>
            <AppText variant="title" semiBold>
              {devotional.title}
            </AppText>
            <AppText variant="scripture" italic style={{ marginTop: theme.spacing.md }}>
              “{devotional.scripture.text}”
            </AppText>
            <AppText variant="small" color={theme.colors.textMuted} style={{ marginTop: theme.spacing.sm }}>
              {devotional.reflection.split('\n\n')[0]}
            </AppText>
          </Card>
          <AppButton
            label={t('common.shortOnTimeButton')}
            icon="timer-outline"
            variant="ghost"
            onPress={() => router.push(`/quick-evening?day=${day}`)}
            style={{ marginTop: theme.spacing.md }}
          />
          <AppButton
            label={t('common.openFullDevotional')}
            variant="secondary"
            onPress={openFullScreen}
            style={{ marginTop: theme.spacing.md }}
          />
          <AppButton
            label={t('common.markDinnerDone')}
            icon="checkmark"
            onPress={finish}
            style={{ marginTop: theme.spacing.md }}
          />
        </>
      ) : null}

      {step === 'content' && slot === 'bedtime' ? (
        <>
          <Card accent={theme.colors.green}>
            <AppText variant="title" semiBold>
              {prayer.title}
            </AppText>
            <AppText variant="body" style={{ marginTop: theme.spacing.sm }}>
              {prayer.lines.slice(0, 3).join('\n')}
            </AppText>
          </Card>
          <AppButton
            label={t('common.openFullPrayer')}
            variant="secondary"
            onPress={openFullScreen}
            style={{ marginTop: theme.spacing.md }}
          />
          <AppButton
            label={t('common.markBedtimeDone')}
            icon="checkmark"
            onPress={finish}
            style={{ marginTop: theme.spacing.md }}
          />
        </>
      ) : null}

      {step === 'done' ? (
        <Card accent={theme.colors.green}>
          <AppText variant="heading" semiBold center>
            {t('common.slotDoneLabel', { label: labels.doneLabel })} 🎉
          </AppText>
          <AppButton
            label={t('common.backToToday')}
            onPress={() => router.replace('/(tabs)')}
            style={{ marginTop: theme.spacing.lg }}
          />
        </Card>
      ) : null}
    </Screen>
  );
}
