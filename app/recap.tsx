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
import { useTranslation } from '@/i18n/context';
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
  const { t } = useTranslation();
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
    await Share.share({ message, title: t('recap.shareTitle') });
  };

  const shareWeeklySheet = async () => {
    if (!recap) return;
    const message = buildWeeklySheetText({ familyName, recap, sundayNote });
    await Share.share({ message, title: t('recap.sheetTitle') });
  };

  const printWeeklySheet = async () => {
    if (!recap) return;
    const html = buildWeeklySheetHtml({ familyName, recap, sundayNote });
    await Print.printAsync({ html });
  };

  return (
    <Screen contentStyle={{ paddingTop: insets.top + theme.spacing.lg }}>
      <AppText variant="heading" semiBold accessibilityRole="header">
        {t('recap.title')}
      </AppText>
      {recap ? (
        <>
          <AppText variant="body" color={theme.colors.textMuted} style={{ marginTop: theme.spacing.sm }}>
            {recap.weekLabel}
          </AppText>

          <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.md, flexWrap: 'wrap' }}>
            <AppButton label={t('common.shareWithFamily')} icon="share-outline" onPress={shareWithFamily} style={{ flex: 1, minWidth: 140 }} />
            <AppButton label={t('common.printWeeklySheet')} icon="print-outline" variant="secondary" onPress={printWeeklySheet} style={{ flex: 1, minWidth: 140 }} />
          </View>
          <AppButton
            label={t('common.shareTextSheet')}
            icon="document-text-outline"
            variant="ghost"
            onPress={shareWeeklySheet}
            style={{ marginTop: theme.spacing.sm }}
          />

          <Card style={{ marginTop: theme.spacing.lg }}>
            <AppText variant="body" semiBold>
              {t('common.journalRecapCount', {
                journal: recap.journalCount,
                prayers: recap.answeredPrayerCount,
              })}
            </AppText>
            <AppText variant="small" color={theme.colors.textMuted} style={{ marginTop: theme.spacing.xs }}>
              {t('common.recapThemes', { themes: recap.themes.join(', ') })}
            </AppText>
            {sundayNote ? (
              <AppText variant="small" italic style={{ marginTop: theme.spacing.sm }}>
                {t('common.fromChurch', { note: sundayNote })}
              </AppText>
            ) : null}
          </Card>

          <SectionLabel>{t('recap.thisWeekReadings')}</SectionLabel>
          <View style={{ gap: theme.spacing.sm }}>
            {recap.days.map((d) => (
              <Card key={d.day}>
                <AppText variant="small" semiBold scaled={false} color={theme.colors.goldDeep}>
                  {d.dateLabel} · {t('common.dayLabel', { day: d.day })}
                </AppText>
                <AppText variant="body" style={{ marginTop: 2 }}>
                  {d.references}
                </AppText>
                <AppText variant="small" color={theme.colors.textMuted}>
                  {d.theme}
                </AppText>
                {d.journalNote ? (
                  <AppText variant="small" italic style={{ marginTop: theme.spacing.sm }}>
                    {t('common.journalPrefix', { note: d.journalNote })}
                  </AppText>
                ) : null}
              </Card>
            ))}
          </View>
        </>
      ) : (
        <AppText variant="body" style={{ marginTop: theme.spacing.lg }}>
          {t('recap.noPlanStart')}
        </AppText>
      )}

      <AppButton
        label={t('common.backToToday')}
        variant="secondary"
        onPress={() => router.back()}
        style={{ marginTop: theme.spacing.xl }}
      />
    </Screen>
  );
}
