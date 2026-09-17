import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/AppButton';
import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { SectionLabel } from '@/components/SectionLabel';
import { TextSizeControl } from '@/components/TextSizeControl';
import { VacationModeCard } from '@/components/VacationModeCard';
import { useTranslation } from '@/i18n/context';
import { completedBooks } from '@/lib/book-milestones';
import { clearBibleCache } from '@/lib/bible';
import { currentPlanDay, todayISO } from '@/lib/dates';
import {
  buildFamilyBackup,
  exportYearKeepsake,
  shareFamilyDataExport,
} from '@/lib/export-data';
import { mergeBackupIntoLocal, parseFamilyBackup } from '@/lib/import-data';
import { requestNotificationPermission, scheduleRhythmReminders } from '@/lib/notifications';
import { prefetchDays, type PrefetchResult } from '@/lib/prefetch';
import { useTheme } from '@/lib/theme-context';
import { useFavorites } from '@/store/favorites';
import { useJournal } from '@/store/journal';
import { usePrayerList } from '@/store/prayer-list';
import { useProgress } from '@/store/progress';
import {
  useSettings,
  type AgeBand,
  type AppLanguage,
  type ReminderTime,
  type SpeechRate,
  type ThemePreference,
} from '@/store/settings';

const TIME_PRESETS: ReminderTime[] = [
  { hour: 7, minute: 0 },
  { hour: 8, minute: 0 },
  { hour: 12, minute: 0 },
  { hour: 18, minute: 0 },
  { hour: 19, minute: 30 },
  { hour: 20, minute: 30 },
];

const THEME_OPTION_KEYS: { key: string; value: ThemePreference }[] = [
  { key: 'settings.themeSystem', value: 'system' },
  { key: 'settings.themeLight', value: 'light' },
  { key: 'settings.themeDark', value: 'dark' },
];

const SPEECH_RATE_KEYS: { key: string; value: SpeechRate }[] = [
  { key: 'settings.speechSlow', value: 'slow' },
  { key: 'settings.speechNormal', value: 'normal' },
  { key: 'settings.speechFast', value: 'fast' },
];

const AGE_BAND_KEYS: { key: string; value: AgeBand }[] = [
  { key: 'settings.ageBandLittle', value: 'little' },
  { key: 'settings.ageBandOlder', value: 'older' },
  { key: 'settings.ageBandTeen', value: 'teen' },
];

const LANGUAGE_OPTIONS: { key: string; value: AppLanguage }[] = [
  { key: 'settings.languageDevice', value: 'device' },
  { key: 'settings.languageEn', value: 'en' },
  { key: 'settings.languageEs', value: 'es' },
];

function formatReminder(time: ReminderTime | null, offLabel: string): string {
  if (!time) return offLabel;
  const d = new Date();
  d.setHours(time.hour, time.minute, 0, 0);
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

/** Settings: rhythm reminders, children, backup, keepsake, and plan options. */
export default function SettingsScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const settings = useSettings();
  const [importVisible, setImportVisible] = useState(false);
  const [importText, setImportText] = useState('');

  const themeOptions = THEME_OPTION_KEYS.map((o) => ({ label: t(o.key), value: o.value }));
  const speechRateOptions = SPEECH_RATE_KEYS.map((o) => ({ label: t(o.key), value: o.value }));
  const ageBands = AGE_BAND_KEYS.map((o) => ({ label: t(o.key), value: o.value }));
  const languageOptions = LANGUAGE_OPTIONS.map((o) => ({ label: t(o.key), value: o.value }));
  const offLabel = t('common.off');

  const changeLanguage = async (language: AppLanguage) => {
    settings.setLanguage(language);
    await scheduleRhythmReminders({
      morning: settings.morningReminder,
      dinner: settings.dinnerReminder,
      bedtime: settings.bedtimeReminder,
    });
  };

  const pickSlotReminder = async (
    slot: 'morning' | 'dinner' | 'bedtime',
    time: ReminderTime | null
  ) => {
    if (time) {
      const allowed = await requestNotificationPermission();
      if (!allowed) {
        Alert.alert(t('alerts.notificationsOffTitle'), t('alerts.notificationsOffMessage'));
        return;
      }
    }
    const next = {
      morning: settings.morningReminder,
      dinner: settings.dinnerReminder,
      bedtime: settings.bedtimeReminder,
      [slot]: time,
    };
    await scheduleRhythmReminders(next);
    if (slot === 'morning') settings.setMorningReminder(time);
    else if (slot === 'dinner') settings.setDinnerReminder(time);
    else settings.setBedtimeReminder(time);
  };

  const exportBackup = async () => {
    const backup = buildFamilyBackup({
      settings: useSettings.getState(),
      progress: {
        completedDays: useProgress.getState().completedDays,
        devotionalDays: useProgress.getState().devotionalDays,
        prayerDays: useProgress.getState().prayerDays,
        practicedWeeks: useProgress.getState().practicedWeeks,
        slotCompletions: useProgress.getState().slotCompletions,
        familyChallengesDone: useProgress.getState().familyChallengesDone,
        familyChallengeNotes: useProgress.getState().familyChallengeNotes,
        prayerParticipation: useProgress.getState().prayerParticipation,
        celebratedBookMilestones: useProgress.getState().celebratedBookMilestones,
      },
      journal: useJournal.getState().entries,
      favorites: useFavorites.getState().favorites,
      prayerList: usePrayerList.getState().requests,
    });
    const json = JSON.stringify(backup, null, 2);
    await Clipboard.setStringAsync(json);
    Alert.alert(t('alerts.backupCopiedTitle'), t('alerts.backupCopiedMessage'));
  };

  const exportKeepsake = async () => {
    const md = exportYearKeepsake({
      settings: useSettings.getState(),
      progress: {
        completedDays: useProgress.getState().completedDays,
        devotionalDays: useProgress.getState().devotionalDays,
        prayerDays: useProgress.getState().prayerDays,
        practicedWeeks: useProgress.getState().practicedWeeks,
        slotCompletions: useProgress.getState().slotCompletions,
        familyChallengesDone: useProgress.getState().familyChallengesDone,
        familyChallengeNotes: useProgress.getState().familyChallengeNotes,
        prayerParticipation: useProgress.getState().prayerParticipation,
        celebratedBookMilestones: useProgress.getState().celebratedBookMilestones,
      },
      journal: useJournal.getState().entries,
      favorites: useFavorites.getState().favorites,
      prayerList: usePrayerList.getState().requests,
    });
    await Clipboard.setStringAsync(md);
    Alert.alert(t('alerts.keepsakeCopiedTitle'), t('alerts.keepsakeCopiedMessage'));
  };

  const runImport = () => {
    const result = parseFamilyBackup(importText);
    if (!result.ok) {
      Alert.alert(t('alerts.importFailedTitle'), result.error);
      return;
    }
    const merged = mergeBackupIntoLocal(
      {
        journal: useJournal.getState().entries,
        favorites: useFavorites.getState().favorites,
        prayerList: usePrayerList.getState().requests,
        progress: {
          completedDays: useProgress.getState().completedDays,
          devotionalDays: useProgress.getState().devotionalDays,
          prayerDays: useProgress.getState().prayerDays,
          practicedWeeks: useProgress.getState().practicedWeeks,
          slotCompletions: useProgress.getState().slotCompletions,
          familyChallengesDone: useProgress.getState().familyChallengesDone,
          familyChallengeNotes: useProgress.getState().familyChallengeNotes,
          prayerParticipation: useProgress.getState().prayerParticipation,
          celebratedBookMilestones: useProgress.getState().celebratedBookMilestones,
        },
      },
      result.backup
    );
    useProgress.getState().applyImportedProgress(merged.progress);
    useJournal.setState({ entries: merged.journal });
    useFavorites.setState({ favorites: merged.favorites });
    usePrayerList.setState({ requests: merged.prayerList });
    if (result.backup.settings) {
      useSettings.getState().applyImportedSettings(result.backup.settings);
    }
    setImportVisible(false);
    setImportText('');
    Alert.alert(t('alerts.importCompleteTitle'), t('alerts.importCompleteMessage'));
  };

  const restartPlan = () => {
    Alert.alert(
      t('alerts.restartPlanTitle'),
      t('alerts.restartPlanMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.restart'),
          style: 'destructive',
          onPress: () => {
            settings.setPlanStartDate(todayISO());
            useProgress.getState().resetProgress();
          },
        },
      ]
    );
  };

  const resetProgressConfirm = () => {
    Alert.alert(
      t('alerts.resetProgressTitle'),
      t('alerts.resetProgressMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.resetEverything'), style: 'destructive', onPress: () => useProgress.getState().resetProgress() },
      ]
    );
  };

  const clearCacheConfirm = () => {
    Alert.alert(t('alerts.clearCacheTitle'), t('alerts.clearCacheMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.clear'),
        style: 'destructive',
        onPress: async () => {
          const removed = await clearBibleCache();
          Alert.alert(t('alerts.doneTitle'), t('common.cachedChaptersRemoved', { count: removed }));
        },
      },
    ]);
  };

  const exportData = async () => {
    try {
      await shareFamilyDataExport();
    } catch {
      Alert.alert(t('alerts.exportFailedTitle'), t('alerts.exportFailedMessage'));
    }
  };

  return (
    <Screen contentStyle={{ paddingTop: insets.top + theme.spacing.lg }}>
      <AppText variant="heading" semiBold accessibilityRole="header">
        {t('settings.title')}
      </AppText>

      <SectionLabel>{t('settings.language')}</SectionLabel>
      <OptionRow
        options={languageOptions.map((o) => o.label)}
        selectedIndex={languageOptions.findIndex((o) => o.value === settings.language)}
        onSelect={(i) => changeLanguage(languageOptions[i].value)}
      />

      <SectionLabel>{t('settings.familyName')}</SectionLabel>
      <FamilyNameInput
        key={settings.familyName}
        familyName={settings.familyName}
        onSave={(name) => settings.setFamilyName(name)}
      />

      <SectionLabel>{t('settings.childrenSection')}</SectionLabel>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm, marginBottom: theme.spacing.sm }}>
        {ageBands.map((band) => (
          <Pressable
            key={band.value}
            onPress={() => settings.addChild({ ageBand: band.value })}
            style={({ pressed }) => ({
              backgroundColor: pressed ? theme.colors.surfaceAlt : theme.colors.surface,
              borderWidth: 1,
              borderColor: theme.colors.border,
              borderRadius: theme.radius.pill,
              paddingHorizontal: theme.spacing.lg,
              minHeight: theme.minTouch,
              justifyContent: 'center',
            })}
          >
            <AppText variant="small" semiBold scaled={false}>
              {t('common.addChild', { label: band.label })}
            </AppText>
          </Pressable>
        ))}
      </View>
      {settings.children.length > 0 ? (
        <AppText variant="small" color={theme.colors.textMuted}>
          {settings.children.map((c, i) => `${i + 1}. ${c.ageBand}`).join(' · ')}
          {' — '}
          <AppText
            variant="small"
            semiBold
            color={theme.colors.danger}
            onPress={() => settings.setChildren([])}
          >
            {t('common.clearAll')}
          </AppText>
        </AppText>
      ) : (
        <AppText variant="small" color={theme.colors.textMuted}>
          {t('settings.noChildren')}
        </AppText>
      )}

      <SectionLabel>{t('settings.appearance')}</SectionLabel>
      <OptionRow
        options={themeOptions.map((o) => o.label)}
        selectedIndex={themeOptions.findIndex((o) => o.value === settings.themePreference)}
        onSelect={(i) => settings.setThemePreference(themeOptions[i].value)}
      />

      <SectionLabel>{t('settings.readingTextSize')}</SectionLabel>
      <View style={{ alignItems: 'flex-start' }}>
        <TextSizeControl />
      </View>

      <SectionLabel>{t('settings.readAloudSpeed')}</SectionLabel>
      <OptionRow
        options={speechRateOptions.map((o) => o.label)}
        selectedIndex={speechRateOptions.findIndex((o) => o.value === settings.speechRate)}
        onSelect={(i) => settings.setSpeechRate(speechRateOptions[i].value)}
      />

      <SectionLabel>{t('settings.rhythmReminders')}</SectionLabel>
      {(['morning', 'dinner', 'bedtime'] as const).map((slot) => {
        const current =
          slot === 'morning'
            ? settings.morningReminder
            : slot === 'dinner'
              ? settings.dinnerReminder
              : settings.bedtimeReminder;
        const slotLabel = t(`rhythm.${slot}.short`);
        return (
          <View key={slot} style={{ marginBottom: theme.spacing.md }}>
            <AppText variant="small" semiBold scaled={false} style={{ marginBottom: theme.spacing.xs }}>
              {slotLabel} · {formatReminder(current, offLabel)}
            </AppText>
            <OptionRow
              options={[...TIME_PRESETS.map((time) => formatReminder(time, offLabel)), offLabel]}
              selectedIndex={
                current
                  ? TIME_PRESETS.findIndex(
                      (t) => t.hour === current.hour && t.minute === current.minute
                    )
                  : TIME_PRESETS.length
              }
              onSelect={(i) =>
                pickSlotReminder(slot, i < TIME_PRESETS.length ? TIME_PRESETS[i] : null)
              }
            />
          </View>
        );
      })}

      <SectionLabel>{t('settings.vacationTravel')}</SectionLabel>
      <VacationModeCard />

      <SectionLabel>{t('settings.bibleBookMilestones')}</SectionLabel>
      <Card>
        {(() => {
          const books = completedBooks(useProgress.getState().completedDays);
          return books.length > 0 ? (
            <AppText variant="body">
              {books.join(' · ')}
            </AppText>
          ) : (
            <AppText variant="small" color={theme.colors.textMuted}>
              {t('settings.milestonesEmpty')}
            </AppText>
          );
        })()}
      </Card>

      <SectionLabel>{t('settings.seasonalOverlays')}</SectionLabel>
      <OptionRow
        options={[t('settings.seasonalOn'), t('settings.seasonalOff')]}
        selectedIndex={settings.seasonalOverlaysEnabled ? 0 : 1}
        onSelect={(i) => settings.setSeasonalOverlaysEnabled(i === 0)}
      />

      <SectionLabel>{t('settings.backupKeepsake')}</SectionLabel>
      <View style={{ gap: theme.spacing.md }}>
        <Card onPress={exportBackup} accessibilityLabel={t('common.exportBackupA11y')}>
          <AppText variant="body" semiBold>
            {t('common.exportFamilyBackup')}
          </AppText>
          <AppText variant="small" color={theme.colors.textMuted} style={{ marginTop: 2 }}>
            {t('settings.backupDescription')}
          </AppText>
        </Card>
        <Card onPress={() => setImportVisible(true)} accessibilityLabel={t('common.importBackupA11y')}>
          <AppText variant="body" semiBold>
            {t('common.importFromBackup')}
          </AppText>
          <AppText variant="small" color={theme.colors.textMuted} style={{ marginTop: 2 }}>
            {t('settings.importDescription')}
          </AppText>
        </Card>
        <Card onPress={exportKeepsake} accessibilityLabel={t('common.exportKeepsakeA11y')}>
          <AppText variant="body" semiBold>
            {t('common.exportYearKeepsake')}
          </AppText>
          <AppText variant="small" color={theme.colors.textMuted} style={{ marginTop: 2 }}>
            {t('settings.keepsakeDescription')}
          </AppText>
        </Card>
      </View>

      <SectionLabel>{t('settings.readingPlan')}</SectionLabel>
      <View style={{ gap: theme.spacing.md }}>
        <Card onPress={restartPlan} accessibilityLabel={t('common.restartPlanA11y')}>
          <AppText variant="body" semiBold>
            {t('common.restartFromToday')}
          </AppText>
          <AppText variant="small" color={theme.colors.textMuted} style={{ marginTop: 2 }}>
            {t('common.restartPlanStarted', { date: settings.planStartDate ?? '—' })}
          </AppText>
        </Card>
        <Card
          onPress={() => {
            settings.replayOnboarding();
            router.replace('/onboarding');
          }}
          accessibilityLabel={t('common.replayOnboardingA11y')}
        >
          <AppText variant="body" semiBold>
            {t('common.replayWelcome')}
          </AppText>
        </Card>
        <Card onPress={resetProgressConfirm} accessibilityLabel={t('common.resetProgressA11y')}>
          <AppText variant="body" semiBold color={theme.colors.danger}>
            {t('common.resetAllProgress')}
          </AppText>
        </Card>
        <Card onPress={clearCacheConfirm} accessibilityLabel={t('common.clearCacheA11y')}>
          <AppText variant="body" semiBold>
            {t('common.clearDownloaded')}
          </AppText>
        </Card>
      </View>

      <SectionLabel>{t('settings.offlineReading')}</SectionLabel>
      <DownloadAheadCard planStartDate={settings.planStartDate} />

      <SectionLabel>{t('settings.yourData')}</SectionLabel>
      <Card onPress={exportData} accessibilityLabel={t('common.exportDataA11y')}>
        <AppText variant="body" semiBold>
          {t('common.exportFamilyData')}
        </AppText>
        <AppText variant="small" color={theme.colors.textMuted} style={{ marginTop: 2 }}>
          {t('settings.exportDataDescription')}
        </AppText>
      </Card>

      <SectionLabel>{t('settings.about')}</SectionLabel>
      <Card>
        <AppText variant="small" color={theme.colors.textMuted}>
          {t('settings.aboutText')}
        </AppText>
      </Card>

      <Modal visible={importVisible} animationType="slide" transparent>
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.4)',
            justifyContent: 'flex-end',
          }}
        >
          <View
            style={{
              backgroundColor: theme.colors.background,
              borderTopLeftRadius: theme.radius.lg,
              borderTopRightRadius: theme.radius.lg,
              padding: theme.spacing.lg,
              maxHeight: '80%',
            }}
          >
            <AppText variant="heading" semiBold>
              {t('settings.importModalTitle')}
            </AppText>
            <AppText variant="small" color={theme.colors.textMuted} style={{ marginVertical: theme.spacing.sm }}>
              {t('settings.importModalHint')}
            </AppText>
            <TextInput
              value={importText}
              onChangeText={setImportText}
              multiline
              placeholder={t('settings.importPlaceholder')}
              placeholderTextColor={theme.colors.textMuted}
              style={{
                minHeight: 160,
                borderWidth: 1,
                borderColor: theme.colors.border,
                borderRadius: theme.radius.md,
                padding: theme.spacing.md,
                color: theme.colors.text,
                fontFamily: theme.fonts.sans,
                textAlignVertical: 'top',
              }}
            />
            <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.md }}>
              <AppButton label={t('common.cancel')} variant="secondary" onPress={() => setImportVisible(false)} style={{ flex: 1 }} />
              <AppButton label={t('common.import')} onPress={runImport} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

function DownloadAheadCard({ planStartDate }: { planStartDate: string | null }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [result, setResult] = useState<PrefetchResult | null>(null);
  const [running, setRunning] = useState(false);

  const start = async () => {
    if (running) return;
    setRunning(true);
    setResult(null);
    const day = planStartDate ? currentPlanDay(planStartDate, todayISO()) : 1;
    const prefetchResult = await prefetchDays(day, 30, (p) =>
      setResult({ ...p, complete: p.failed === 0 })
    );
    setResult(prefetchResult);
    setRunning(false);
  };

  const finished = !running && result !== null;
  const savedCount = result ? result.done - result.failed : 0;
  const label = running
    ? t('common.downloadProgress', {
        done: result?.done ?? 0,
        total: result?.total ?? 0,
      })
    : finished
      ? result.complete
        ? t('common.downloadDoneAll', { total: result.total })
        : t('common.downloadDonePartial', {
            saved: savedCount,
            total: result.total,
            failed: result.failed,
          })
      : t('common.downloadNext30');

  const subtitle = finished
    ? result.complete
      ? t('common.downloadSubtitleDone')
      : t('common.downloadSubtitleRetry')
    : t('common.downloadSubtitleIdle');

  return (
    <Card
      onPress={running ? undefined : start}
      accessibilityLabel={t('common.downloadOfflineA11y')}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
        {running ? (
          <ActivityIndicator color={theme.colors.gold} />
        ) : (
          <Ionicons
            name={finished ? (result?.complete ? 'checkmark-circle' : 'alert-circle') : 'cloud-download'}
            size={24}
            color={
              finished
                ? result?.complete
                  ? theme.colors.success
                  : theme.colors.goldDeep
                : theme.colors.goldDeep
            }
          />
        )}
        <View style={{ flex: 1 }}>
          <AppText variant="body" semiBold>
            {label}
          </AppText>
          <AppText variant="small" color={theme.colors.textMuted} style={{ marginTop: 2 }}>
            {subtitle}
          </AppText>
        </View>
      </View>
    </Card>
  );
}

function FamilyNameInput({
  familyName,
  onSave,
}: {
  familyName: string;
  onSave: (name: string) => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [name, setName] = useState(familyName);

  return (
    <TextInput
      value={name}
      onChangeText={setName}
      onEndEditing={() => onSave(name.trim())}
      placeholder={t('settings.familyNamePlaceholder')}
      placeholderTextColor={theme.colors.textMuted}
      accessibilityLabel={t('common.familyNameA11y')}
      style={{
        minHeight: theme.minTouch + 4,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.radius.md,
        paddingHorizontal: theme.spacing.lg,
        color: theme.colors.text,
        fontFamily: theme.fonts.sans,
        fontSize: theme.fontSizes.body,
        backgroundColor: theme.colors.surface,
      }}
    />
  );
}

function OptionRow({
  options,
  selectedIndex,
  onSelect,
}: {
  options: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
      {options.map((label, i) => {
        const active = i === selectedIndex;
        return (
          <Pressable
            key={`${label}-${i}`}
            onPress={() => onSelect(i)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={({ pressed }) => ({
              backgroundColor: active
                ? theme.colors.gold
                : pressed
                  ? theme.colors.surfaceAlt
                  : theme.colors.surface,
              borderWidth: 1,
              borderColor: active ? theme.colors.gold : theme.colors.border,
              borderRadius: theme.radius.pill,
              paddingHorizontal: theme.spacing.lg,
              minHeight: theme.minTouch,
              justifyContent: 'center',
            })}
          >
            <AppText
              variant="small"
              semiBold
              scaled={false}
              color={active ? theme.colors.onAccent : theme.colors.text}
            >
              {label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}
