import { router } from 'expo-router';
import * as Print from 'expo-print';
import React from 'react';
import { Share, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/AppButton';
import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { SectionLabel } from '@/components/SectionLabel';
import { buildShareRecapMessage } from '@/lib/share-recap';
import { todayISO } from '@/lib/dates';
import { weekKeyForDate } from '@/lib/week-key';
import { buildWeeklyRecap } from '@/lib/weekly-recap';
import { buildWeeklySheetHtml, buildWeeklySheetText } from '@/lib/weekly-sheet';
import { useTheme } from '@/lib/theme-context';
import { useJournal } from '@/store/journal';
import { usePrayerList } from '@/store/prayer-list';
import { useSettings } from '@/store/settings';

/** Weekly recap — readings, themes, journal, answered prayers, share & print. */
export default function RecapScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const familyName = useSettings((s) => s.familyName);
  const planStartDate = useSettings((s) => s.planStartDate);
  const sundayNotes = useSettings((s) => s.sundayNotes);
  const journalEntries = useJournal((s) => s.entries);
  const prayerRequests = usePrayerList((s) => s.requests);
  const today = todayISO();

  const answered = prayerRequests.filter((r) => r.answeredAt);
  const recap = planStartDate
    ? buildWeeklyRecap(planStartDate, today, journalEntries, answered.length)
    : null;
  const sundayNote = sundayNotes[weekKeyForDate(today)];

  const shareWithFamily = async () => {
    if (!recap) return;
    const message = buildShareRecapMessage({
      familyName,
      recap,
      sundayNote,
      answeredPrayers: prayerRequests,
    });
    await Share.share({ message, title: 'Our week in the Word' });
  };

  const shareWeeklySheet = async () => {
    if (!recap) return;
    const message = buildWeeklySheetText({ familyName, recap, sundayNote });
    await Share.share({ message, title: 'Weekly family sheet' });
  };

  const printWeeklySheet = async () => {
    if (!recap) return;
    const html = buildWeeklySheetHtml({ familyName, recap, sundayNote });
    await Print.printAsync({ html });
  };

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

          <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.md, flexWrap: 'wrap' }}>
            <AppButton label="Share with family" icon="share-outline" onPress={shareWithFamily} style={{ flex: 1, minWidth: 140 }} />
            <AppButton label="Print weekly sheet" icon="print-outline" variant="secondary" onPress={printWeeklySheet} style={{ flex: 1, minWidth: 140 }} />
          </View>
          <AppButton
            label="Share text sheet"
            icon="document-text-outline"
            variant="ghost"
            onPress={shareWeeklySheet}
            style={{ marginTop: theme.spacing.sm }}
          />

          <Card style={{ marginTop: theme.spacing.lg }}>
            <AppText variant="body" semiBold>
              {recap.journalCount} journal entries · {recap.answeredPrayerCount} answered prayers
            </AppText>
            <AppText variant="small" color={theme.colors.textMuted} style={{ marginTop: theme.spacing.xs }}>
              Themes: {recap.themes.join(', ')}
            </AppText>
            {sundayNote ? (
              <AppText variant="small" italic style={{ marginTop: theme.spacing.sm }}>
                From church: {sundayNote}
              </AppText>
            ) : null}
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
