import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { celebrationHaptics } from '@/lib/celebrate';
import { effectivePlanDay } from '@/lib/catch-up';
import { buildQuickEvening } from '@/lib/quick-evening';
import { todayISO } from '@/lib/dates';
import { useTheme } from '@/lib/theme-context';
import { useCelebration } from '@/store/celebration';
import { useProgress } from '@/store/progress';
import { useSettings } from '@/store/settings';

/**
 * ~5-minute evening fallback: teaching point, one age-matched question,
 * abbreviated prayer. Marks devotional + prayer done, not reading.
 */
export default function QuickEveningScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ day?: string }>();
  const planStartDate = useSettings((s) => s.planStartDate);
  const catchUpChoice = useSettings((s) => s.catchUpChoice);
  const children = useSettings((s) => s.children);

  const today = todayISO();
  const defaultDay = planStartDate ? effectivePlanDay(planStartDate, today, catchUpChoice) : 1;
  const day = Math.min(
    365,
    Math.max(1, parseInt(params.day ?? String(defaultDay), 10) || defaultDay)
  );

  const content = buildQuickEvening(day, children);
  const completeQuickEvening = useProgress((s) => s.completeQuickEvening);
  const devotionalDone = useProgress((s) => Boolean(s.devotionalDays[day]));
  const prayerDone = useProgress((s) => Boolean(s.prayerDays[day]));
  const fire = useCelebration((s) => s.fire);

  const audienceLabel =
    content.questionAudience === 'little' ? 'For little ones' : 'For older kids & parents';

  const onComplete = () => {
    completeQuickEvening(day, today);
    fire({ message: 'Family moment complete!', size: 'small' });
    celebrationHaptics('small');
  };

  return (
    <Screen bottomPadding={96}>
      <View style={{ alignItems: 'center', marginBottom: theme.spacing.lg }}>
        <Ionicons name="timer-outline" size={36} color={theme.colors.goldDeep} />
        <AppText variant="display" center accessibilityRole="header">
          Five-minute family moment
        </AppText>
        <AppText variant="small" color={theme.colors.textMuted} center>
          Day {day} · about 5 minutes
        </AppText>
      </View>

      <Card accent={theme.colors.blue}>
        <AppText variant="caption" bold scaled={false} color={theme.colors.goldDeep}>
          TEACHING POINT
        </AppText>
        <AppText variant="bodyLarge" style={{ marginTop: theme.spacing.sm }}>
          {content.teachingPoint}
        </AppText>
      </Card>

      <Card accent={theme.colors.clay} style={{ marginTop: theme.spacing.md }}>
        <AppText variant="caption" bold scaled={false} color={theme.colors.clay}>
          ONE QUESTION · {audienceLabel.toUpperCase()}
        </AppText>
        <AppText variant="bodyLarge" style={{ marginTop: theme.spacing.sm }}>
          {content.question}
        </AppText>
      </Card>

      <Card accent={theme.colors.green} style={{ marginTop: theme.spacing.md }}>
        <AppText variant="caption" bold scaled={false} color={theme.colors.green}>
          SHORT PRAYER
        </AppText>
        {content.prayerLines.map((line, i) => (
          <AppText key={i} variant="bodyLarge" style={{ marginTop: theme.spacing.sm }}>
            {line}
          </AppText>
        ))}
        <AppText variant="body" semiBold style={{ marginTop: theme.spacing.md }}>
          Together: {content.togetherLine}
        </AppText>
      </Card>

      <AppText
        variant="small"
        color={theme.colors.textMuted}
        center
        style={{ marginTop: theme.spacing.lg }}
      >
        {content.gentleNote}
      </AppText>

      <AppButton
        label={
          devotionalDone && prayerDone
            ? 'Devotional & prayer marked done'
            : 'We shared this moment — mark done'
        }
        icon="checkmark-circle"
        variant={devotionalDone && prayerDone ? 'secondary' : 'primary'}
        onPress={onComplete}
        style={{ marginTop: theme.spacing.xl }}
      />

      <AppButton
        label="Open full reading later"
        icon="book-outline"
        variant="ghost"
        onPress={() => router.push(`/day/${day}/reading`)}
        style={{ marginTop: theme.spacing.md }}
      />

      <AppButton
        label="Back to Today"
        variant="ghost"
        onPress={() => router.back()}
        style={{ marginTop: theme.spacing.sm }}
      />
    </Screen>
  );
}
