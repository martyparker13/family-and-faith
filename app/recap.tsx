import { router } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/AppButton';
import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { SectionLabel } from '@/components/SectionLabel';
import { todayISO } from '@/lib/dates';
import { buildWeeklyRecap } from '@/lib/weekly-recap';
import { useTheme } from '@/lib/theme-context';
import { useJournal } from '@/store/journal';
import { usePrayerList } from '@/store/prayer-list';
import { useSettings } from '@/store/settings';

/** Weekly recap — readings, themes, journal, answered prayers. */
export default function RecapScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const planStartDate = useSettings((s) => s.planStartDate);
  const journalEntries = useJournal((s) => s.entries);
  const prayerRequests = usePrayerList((s) => s.requests);
  const today = todayISO();

  const answeredCount = prayerRequests.filter((r) => r.answeredAt).length;
  const recap = planStartDate
    ? buildWeeklyRecap(planStartDate, today, journalEntries, answeredCount)
    : null;

  return (
    <Screen contentStyle={{ paddingTop: insets.top + theme.spacing.lg }}>
      <AppText variant="heading" semiBold accessibilityRole="header">
        Weekly recap
      </AppText>
      {recap ? (
        <>
          <AppText variant="body" color={theme.colors.textMuted} style={{ marginTop: theme.spacing.sm }}>
            {recap.weekLabel}
          </AppText>

          <Card style={{ marginTop: theme.spacing.lg }}>
            <AppText variant="body" semiBold>
              {recap.journalCount} journal entries · {recap.answeredPrayerCount} answered prayers
            </AppText>
            <AppText variant="small" color={theme.colors.textMuted} style={{ marginTop: theme.spacing.xs }}>
              Themes: {recap.themes.join(', ')}
            </AppText>
          </Card>

          <SectionLabel>This week’s readings</SectionLabel>
          <View style={{ gap: theme.spacing.sm }}>
            {recap.days.map((d) => (
              <Card key={d.day}>
                <AppText variant="small" semiBold scaled={false} color={theme.colors.goldDeep}>
                  {d.dateLabel} · Day {d.day}
                </AppText>
                <AppText variant="body" style={{ marginTop: 2 }}>
                  {d.references}
                </AppText>
                <AppText variant="small" color={theme.colors.textMuted}>
                  {d.theme}
                </AppText>
                {d.journalNote ? (
                  <AppText variant="small" italic style={{ marginTop: theme.spacing.sm }}>
                    Journal: {d.journalNote}
                  </AppText>
                ) : null}
              </Card>
            ))}
          </View>
        </>
      ) : (
        <AppText variant="body" style={{ marginTop: theme.spacing.lg }}>
          Set a plan start date in Settings to see your weekly recap.
        </AppText>
      )}

      <AppButton
        label="Back to Today"
        variant="secondary"
        onPress={() => router.back()}
        style={{ marginTop: theme.spacing.xl }}
      />
    </Screen>
  );
}
