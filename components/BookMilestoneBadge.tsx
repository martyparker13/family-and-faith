import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { celebrationHaptics } from '@/lib/celebrate';
import { latestBookCompletion } from '@/lib/book-milestones';
import { todayISO } from '@/lib/dates';
import { useTheme } from '@/lib/theme-context';
import { useCelebration } from '@/store/celebration';
import { useProgress } from '@/store/progress';

/** Celebrates the most recent uncelebrated Bible book completion. */
export function BookMilestoneBadge() {
  const theme = useTheme();
  const completedDays = useProgress((s) => s.completedDays);
  const celebratedBookMilestones = useProgress((s) => s.celebratedBookMilestones);
  const recordBookCelebration = useProgress((s) => s.recordBookCelebration);
  const fire = useCelebration((s) => s.fire);

  const latest = latestBookCompletion(completedDays, celebratedBookMilestones);
  const latestBook = latest?.book;
  const latestDay = latest?.day;

  useEffect(() => {
    if (!latestBook || latestDay === undefined) return;
    fire({ message: `📖 Finished ${latestBook}!`, size: 'big' });
    celebrationHaptics('big');
    recordBookCelebration(latestBook, todayISO());
  }, [latestBook, latestDay, fire, recordBookCelebration]);

  if (!latest) return null;

  return (
    <Card accent={theme.colors.green} style={{ marginBottom: theme.spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
        <Ionicons name="ribbon" size={28} color={theme.colors.green} />
        <View style={{ flex: 1 }}>
          <AppText variant="caption" bold scaled={false} color={theme.colors.green}>
            BOOK COMPLETE
          </AppText>
          <AppText variant="title" semiBold style={{ marginTop: 2 }}>
            You finished {latest.book}!
          </AppText>
          <AppText variant="small" color={theme.colors.textMuted}>
            Day {latest.day} — another milestone on your Bible journey.
          </AppText>
        </View>
      </View>
    </Card>
  );
}
