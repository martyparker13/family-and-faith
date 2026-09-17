import React from 'react';

import { AppButton } from './AppButton';
import { useTranslation } from '@/i18n/context';
import {
  celebrationFor,
  celebrationHaptics,
  isStreakMilestoneCelebration,
  undoHaptics,
} from '@/lib/celebrate';
import { todayISO } from '@/lib/dates';
import { useCelebration } from '@/store/celebration';
import { useProgress, type Activity } from '@/store/progress';

/**
 * Mark-as-complete button for a daily activity. Completing triggers haptics
 * and a confetti burst — bigger when it finishes all three activities for
 * the day or hits a streak milestone.
 */
export function CompleteActivityButton({ activity, day }: { activity: Activity; day: number }) {
  const { t } = useTranslation();
  const progress = useProgress();
  const recordKey =
    activity === 'reading'
      ? 'completedDays'
      : activity === 'devotional'
        ? 'devotionalDays'
        : 'prayerDays';
  const done = Boolean(progress[recordKey][day]);
  const fire = useCelebration((s) => s.fire);

  const labelKeys: Record<Activity, { todo: string; done: string }> = {
    reading: { todo: 'common.markReadingComplete', done: 'common.readingCompleted' },
    devotional: { todo: 'common.markDevotionalComplete', done: 'common.devotionalCompleted' },
    prayer: { todo: 'common.markPrayerComplete', done: 'common.prayerCompleted' },
  };

  const toggle = () => {
    const today = todayISO();
    progress.toggleActivity(activity, day, today);
    if (done) {
      undoHaptics();
      return;
    }
    const after = useProgress.getState();
    const celebration = celebrationFor(after, day, today, after.celebratedMilestones);
    fire(celebration);
    celebrationHaptics(celebration.size);
    const milestone = isStreakMilestoneCelebration(after, today, celebration);
    if (milestone !== null) {
      after.recordMilestoneCelebration(milestone, today);
    }
  };

  return (
    <AppButton
      label={done ? t(labelKeys[activity].done) : t(labelKeys[activity].todo)}
      icon={done ? 'checkmark-circle' : 'ellipse-outline'}
      variant={done ? 'secondary' : 'primary'}
      onPress={toggle}
      accessibilityHint={t('common.completeActivityHint')}
    />
  );
}
