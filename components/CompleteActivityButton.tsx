import React from 'react';

import { AppButton } from './AppButton';
import { celebrationFor, celebrationHaptics, undoHaptics } from '@/lib/celebrate';
import { todayISO } from '@/lib/dates';
import { useCelebration } from '@/store/celebration';
import { useProgress, type Activity } from '@/store/progress';

const LABELS: Record<Activity, { todo: string; done: string }> = {
  reading: { todo: 'Mark reading as complete', done: 'Reading completed — tap to undo' },
  devotional: { todo: 'We talked about it!', done: 'Devotional completed — tap to undo' },
  prayer: { todo: 'We prayed together!', done: 'Prayer completed — tap to undo' },
};

/**
 * Mark-as-complete button for a daily activity. Completing triggers haptics
 * and a confetti burst — bigger when it finishes all three activities for
 * the day or hits a streak milestone.
 */
export function CompleteActivityButton({ activity, day }: { activity: Activity; day: number }) {
  const progress = useProgress();
  const recordKey =
    activity === 'reading'
      ? 'completedDays'
      : activity === 'devotional'
        ? 'devotionalDays'
        : 'prayerDays';
  const done = Boolean(progress[recordKey][day]);
  const fire = useCelebration((s) => s.fire);

  const toggle = () => {
    const today = todayISO();
    progress.toggleActivity(activity, day, today);
    if (done) {
      undoHaptics();
      return;
    }
    // Read the post-toggle state for milestone/all-three detection.
    const after = useProgress.getState();
    const celebration = celebrationFor(after, day, today);
    fire(celebration);
    celebrationHaptics(celebration.size);
  };

  return (
    <AppButton
      label={done ? LABELS[activity].done : LABELS[activity].todo}
      icon={done ? 'checkmark-circle' : 'ellipse-outline'}
      variant={done ? 'secondary' : 'primary'}
      onPress={toggle}
      accessibilityHint="Tracks this in your family's daily progress"
    />
  );
}
