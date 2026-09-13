import React from 'react';

import { AppButton } from './AppButton';
import { celebrationFor, celebrationHaptics, undoHaptics } from '@/lib/celebrate';
import { todayISO } from '@/lib/dates';
import { useCelebration } from '@/store/celebration';
import { useDailyContent } from '@/store/daily-content';
import { useProgress } from '@/store/progress';

const LABELS = {
  todo: 'Mark reading as complete',
  done: 'Reading completed — tap to undo',
};

/**
 * Mark-as-complete button for the daily reading. Completing triggers haptics
 * and a confetti burst — bigger when all three daily activities are done or
 * a streak milestone is hit.
 */
export function CompleteActivityButton({ day }: { day: number }) {
  const completedDays = useProgress((s) => s.completedDays);
  const toggleDay = useProgress((s) => s.toggleDay);
  const done = Boolean(completedDays[day]);
  const fire = useCelebration((s) => s.fire);

  const toggle = () => {
    const today = todayISO();
    toggleDay(day, today);
    if (done) {
      undoHaptics();
      return;
    }
    const after = useProgress.getState();
    const daily = useDailyContent.getState();
    const celebration = celebrationFor(
      after.completedDays,
      day,
      Boolean(daily.devotionalDoneDate),
      Boolean(daily.prayerDoneDate),
      [daily.devotionalDoneDate, daily.prayerDoneDate],
      today
    );
    fire(celebration);
    celebrationHaptics(celebration.size);
  };

  return (
    <AppButton
      label={done ? LABELS.done : LABELS.todo}
      icon={done ? 'checkmark-circle' : 'ellipse-outline'}
      variant={done ? 'secondary' : 'primary'}
      onPress={toggle}
      accessibilityHint="Tracks this in your family's daily progress"
    />
  );
}
