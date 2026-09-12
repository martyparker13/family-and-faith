import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { MemoryVersePractice } from '@/components/MemoryVersePractice';
import { Screen } from '@/components/Screen';
import { getDevotional, getPlanDay, getPrayer } from '@/lib/content';
import { celebrationHaptics } from '@/lib/celebrate';
import { effectivePlanDay } from '@/lib/catch-up';
import { todayISO } from '@/lib/dates';
import { memoryVerseForDay } from '@/lib/memory-verse';
import {
  SLOT_LABELS,
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
  const labels = SLOT_LABELS[slot];

  const markSlotComplete = useProgress((s) => s.markSlotComplete);
  const fire = useCelebration((s) => s.fire);

  const [step, setStep] = useState<FlowStep>('intro');

  const finish = () => {
    markSlotComplete(slot, day, today);
    fire({ message: `${labels.short} time complete!`, size: 'small' });
    celebrationHaptics('small');
    setStep('done');
  };

  const openFullScreen = () => {
    const activity = slotActivity(slot);
    if (activity === 'reading') router.push(`/day/${day}/reading`);
    else if (activity === 'devotional') router.push(`/day/${day}/devotional`);
    else router.push(`/day/${day}/prayer`);
  };

  return (
    <Screen>
      <View style={{ alignItems: 'center', marginBottom: theme.spacing.lg }}>
        <Ionicons name={labels.icon} size={40} color={theme.colors.goldDeep} />
        <AppText variant="display" center accessibilityRole="header">
          {labels.title}
        </AppText>
        <AppText variant="small" color={theme.colors.textMuted} center>
          Day {day}
        </AppText>
      </View>

      {step === 'intro' ? (
        <Card accent={theme.colors.gold}>
          <AppText variant="bodyLarge">
            {slot === 'morning'
              ? 'Start the day with Scripture and hide this week’s verse in your hearts.'
              : slot === 'dinner'
                ? 'Gather around the table for today’s devotional — one question at a time.'
                : 'Wind down together with tonight’s family prayer.'}
          </AppText>
          <AppButton
            label={labels.startLabel}
            icon="play"
            onPress={() => setStep(slot === 'morning' ? 'content' : 'content')}
            style={{ marginTop: theme.spacing.lg }}
          />
        </Card>
      ) : null}

      {step === 'content' && slot === 'morning' ? (
        <>
          <Card accent={theme.colors.blue}>
            <AppText variant="caption" bold scaled={false} color={theme.colors.goldDeep}>
              TODAY’S READING
            </AppText>
            <AppText variant="title" semiBold style={{ marginTop: theme.spacing.sm }}>
              {plan.passages.map((p) => p.reference).join(' · ')}
            </AppText>
            <AppText variant="body" style={{ marginTop: theme.spacing.sm }}>
              {plan.teachingPoint ?? plan.kidSummary}
            </AppText>
          </Card>
          <AppButton
            label="Open full reading"
            variant="secondary"
            onPress={openFullScreen}
            style={{ marginTop: theme.spacing.md }}
          />
          <AppButton
            label="Next — memory verse"
            onPress={() => setStep('memory')}
            style={{ marginTop: theme.spacing.md }}
          />
        </>
      ) : null}

      {step === 'memory' && slot === 'morning' ? (
        <>
          <MemoryVersePractice verse={verse} day={day} />
          <AppButton label="Mark morning done" icon="checkmark" onPress={finish} style={{ marginTop: theme.spacing.lg }} />
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
            label="Open full devotional"
            variant="secondary"
            onPress={openFullScreen}
            style={{ marginTop: theme.spacing.md }}
          />
          <AppButton label="Mark dinner done" icon="checkmark" onPress={finish} style={{ marginTop: theme.spacing.md }} />
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
            label="Open full prayer"
            variant="secondary"
            onPress={openFullScreen}
            style={{ marginTop: theme.spacing.md }}
          />
          <AppButton label="Mark bedtime done" icon="checkmark" onPress={finish} style={{ marginTop: theme.spacing.md }} />
        </>
      ) : null}

      {step === 'done' ? (
        <Card accent={theme.colors.green}>
          <AppText variant="heading" semiBold center>
            {labels.doneLabel}! 🎉
          </AppText>
          <AppButton label="Back to Today" onPress={() => router.replace('/(tabs)')} style={{ marginTop: theme.spacing.lg }} />
        </Card>
      ) : null}
    </Screen>
  );
}
