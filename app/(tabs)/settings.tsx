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

const THEME_OPTIONS: { label: string; value: ThemePreference }[] = [
  { label: 'System', value: 'system' },
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
];

const SPEECH_RATE_OPTIONS: { label: string; value: SpeechRate }[] = [
  { label: 'Slow', value: 'slow' },
  { label: 'Normal', value: 'normal' },
  { label: 'Fast', value: 'fast' },
];

const AGE_BANDS: { label: string; value: AgeBand }[] = [
  { label: 'Little', value: 'little' },
  { label: 'Older', value: 'older' },
  { label: 'Teen', value: 'teen' },
];

function formatReminder(time: ReminderTime | null): string {
  if (!time) return 'Off';
  const d = new Date();
  d.setHours(time.hour, time.minute, 0, 0);
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

/** Settings: rhythm reminders, children, backup, keepsake, and plan options. */
export default function SettingsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const settings = useSettings();
  const [importVisible, setImportVisible] = useState(false);
  const [importText, setImportText] = useState('');

  const pickSlotReminder = async (
    slot: 'morning' | 'dinner' | 'bedtime',
    time: ReminderTime | null
  ) => {
    if (time) {
      const allowed = await requestNotificationPermission();
      if (!allowed) {
        Alert.alert('Notifications are off', 'Enable notifications in device settings.');
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
      },
      journal: useJournal.getState().entries,
      favorites: useFavorites.getState().favorites,
      prayerList: usePrayerList.getState().requests,
    });
    const json = JSON.stringify(backup, null, 2);
    await Clipboard.setStringAsync(json);
    Alert.alert('Backup copied', 'Family backup JSON is on your clipboard. Paste it into Notes or email to save.');
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
      },
      journal: useJournal.getState().entries,
      favorites: useFavorites.getState().favorites,
      prayerList: usePrayerList.getState().requests,
    });
    await Clipboard.setStringAsync(md);
    Alert.alert('Keepsake copied', 'Markdown keepsake is on your clipboard — paste into any app to share or print.');
  };

  const runImport = () => {
    const result = parseFamilyBackup(importText);
    if (!result.ok) {
      Alert.alert('Import failed', result.error);
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
    Alert.alert('Import complete', 'Your family data was merged — newer entries were kept.');
  };

  const restartPlan = () => {
    Alert.alert(
      'Restart the plan?',
      'Day 1 will become today and all completed-day checkmarks will be cleared so progress matches the new calendar. Your journal, favorites, and prayer list stay saved.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restart',
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
      'Reset all progress?',
      'Completed days, streaks, and memory-verse practice will be cleared.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset everything', style: 'destructive', onPress: () => useProgress.getState().resetProgress() },
      ]
    );
  };

  const clearCacheConfirm = () => {
    Alert.alert('Clear downloaded chapters?', 'Readings will re-download when opened.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          const removed = await clearBibleCache();
          Alert.alert('Done', `${removed} cached chapters removed.`);
        },
      },
    ]);
  };

  const exportData = async () => {
    try {
      await shareFamilyDataExport();
    } catch {
      Alert.alert('Export failed', 'Could not open the share sheet. Please try again.');
    }
  };

  return (
    <Screen contentStyle={{ paddingTop: insets.top + theme.spacing.lg }}>
      <AppText variant="heading" semiBold accessibilityRole="header">
        Settings
      </AppText>

      <SectionLabel>Family name</SectionLabel>
      <FamilyNameInput
        key={settings.familyName}
        familyName={settings.familyName}
        onSave={(name) => settings.setFamilyName(name)}
      />

      <SectionLabel>Children (for age-matched questions)</SectionLabel>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm, marginBottom: theme.spacing.sm }}>
        {AGE_BANDS.map((band) => (
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
              + {band.label}
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
            Clear all
          </AppText>
        </AppText>
      ) : (
        <AppText variant="small" color={theme.colors.textMuted}>
          No children added — all questions will show by default.
        </AppText>
      )}

      <SectionLabel>Appearance</SectionLabel>
      <OptionRow
        options={THEME_OPTIONS.map((o) => o.label)}
        selectedIndex={THEME_OPTIONS.findIndex((o) => o.value === settings.themePreference)}
        onSelect={(i) => settings.setThemePreference(THEME_OPTIONS[i].value)}
      />

      <SectionLabel>Reading text size</SectionLabel>
      <View style={{ alignItems: 'flex-start' }}>
        <TextSizeControl />
      </View>

      <SectionLabel>Read-aloud speed</SectionLabel>
      <OptionRow
        options={SPEECH_RATE_OPTIONS.map((o) => o.label)}
        selectedIndex={SPEECH_RATE_OPTIONS.findIndex((o) => o.value === settings.speechRate)}
        onSelect={(i) => settings.setSpeechRate(SPEECH_RATE_OPTIONS[i].value)}
      />

      <SectionLabel>Rhythm reminders</SectionLabel>
      {(['morning', 'dinner', 'bedtime'] as const).map((slot) => {
        const current =
          slot === 'morning'
            ? settings.morningReminder
            : slot === 'dinner'
              ? settings.dinnerReminder
              : settings.bedtimeReminder;
        return (
          <View key={slot} style={{ marginBottom: theme.spacing.md }}>
            <AppText variant="small" semiBold scaled={false} style={{ marginBottom: theme.spacing.xs }}>
              {slot.charAt(0).toUpperCase() + slot.slice(1)} · {formatReminder(current)}
            </AppText>
            <OptionRow
              options={[...TIME_PRESETS.map(formatReminder), 'Off']}
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

      <SectionLabel>Seasonal overlays</SectionLabel>
      <OptionRow
        options={['On (Advent, etc.)', 'Off']}
        selectedIndex={settings.seasonalOverlaysEnabled ? 0 : 1}
        onSelect={(i) => settings.setSeasonalOverlaysEnabled(i === 0)}
      />

      <SectionLabel>Backup & keepsake</SectionLabel>
      <View style={{ gap: theme.spacing.md }}>
        <Card onPress={exportBackup} accessibilityLabel="Export family backup">
          <AppText variant="body" semiBold>
            Export family backup
          </AppText>
          <AppText variant="small" color={theme.colors.textMuted} style={{ marginTop: 2 }}>
            Copies JSON to clipboard for another device.
          </AppText>
        </Card>
        <Card onPress={() => setImportVisible(true)} accessibilityLabel="Import from backup">
          <AppText variant="body" semiBold>
            Import from backup
          </AppText>
          <AppText variant="small" color={theme.colors.textMuted} style={{ marginTop: 2 }}>
            Merge a backup — newer timestamps win.
          </AppText>
        </Card>
        <Card onPress={exportKeepsake} accessibilityLabel="Export year keepsake">
          <AppText variant="body" semiBold>
            Export year keepsake
          </AppText>
          <AppText variant="small" color={theme.colors.textMuted} style={{ marginTop: 2 }}>
            Markdown summary: journal, milestones, favorites, answered prayers.
          </AppText>
        </Card>
      </View>

      <SectionLabel>Reading plan</SectionLabel>
      <View style={{ gap: theme.spacing.md }}>
        <Card onPress={restartPlan} accessibilityLabel="Restart the 365-day plan from today">
          <AppText variant="body" semiBold>
            Restart the plan from today
          </AppText>
          <AppText variant="small" color={theme.colors.textMuted} style={{ marginTop: 2 }}>
            Day 1 started {settings.planStartDate ?? '—'}. Restarting makes today Day 1 again and
            clears checkmarks so they match the new calendar.
          </AppText>
        </Card>
        <Card
          onPress={() => {
            settings.replayOnboarding();
            router.replace('/onboarding');
          }}
          accessibilityLabel="Replay the welcome setup"
        >
          <AppText variant="body" semiBold>
            Replay the welcome setup
          </AppText>
        </Card>
        <Card onPress={resetProgressConfirm} accessibilityLabel="Reset all progress">
          <AppText variant="body" semiBold color={theme.colors.danger}>
            Reset all progress
          </AppText>
        </Card>
        <Card onPress={clearCacheConfirm} accessibilityLabel="Clear downloaded chapters">
          <AppText variant="body" semiBold>
            Clear downloaded chapters
          </AppText>
        </Card>
      </View>

      <SectionLabel>Offline reading</SectionLabel>
      <DownloadAheadCard planStartDate={settings.planStartDate} />

      <SectionLabel>Your data</SectionLabel>
      <Card onPress={exportData} accessibilityLabel="Export family data as JSON backup">
        <AppText variant="body" semiBold>
          Export family data
        </AppText>
        <AppText variant="small" color={theme.colors.textMuted} style={{ marginTop: 2 }}>
          Save journal, prayers, favorites, and progress as a JSON file you can keep or share.
        </AppText>
      </Card>

      <SectionLabel>About</SectionLabel>
      <Card>
        <AppText variant="small" color={theme.colors.textMuted}>
          Faith & Family v1.1 · Morning reading, dinner talk, bedtime prayer. Scripture from the
          World English Bible (public domain). All data stays on this device unless you export a
          backup.
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
              Import backup
            </AppText>
            <AppText variant="small" color={theme.colors.textMuted} style={{ marginVertical: theme.spacing.sm }}>
              Paste the JSON from a previous export.
            </AppText>
            <TextInput
              value={importText}
              onChangeText={setImportText}
              multiline
              placeholder="Paste backup JSON here…"
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
              <AppButton label="Cancel" variant="secondary" onPress={() => setImportVisible(false)} style={{ flex: 1 }} />
              <AppButton label="Import" onPress={runImport} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

function DownloadAheadCard({ planStartDate }: { planStartDate: string | null }) {
  const theme = useTheme();
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
    ? `Downloading… ${result ? `${result.done} of ${result.total} chapters` : ''}`
    : finished
      ? result.complete
        ? `Done — all ${result.total} chapters saved`
        : `${savedCount} of ${result.total} chapters saved · ${result.failed} failed`
      : 'Download the next 30 days';

  const subtitle = finished
    ? result.complete
      ? 'Upcoming chapters are on this device for offline reading.'
      : 'Some chapters could not download. Tap to retry.'
    : 'Saves upcoming chapters on this device so readings work without internet.';

  return (
    <Card
      onPress={running ? undefined : start}
      accessibilityLabel="Download the next 30 days of readings for offline use"
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
  const [name, setName] = useState(familyName);

  return (
    <TextInput
      value={name}
      onChangeText={setName}
      onEndEditing={() => onSave(name.trim())}
      placeholder="e.g. The Parker Family"
      placeholderTextColor={theme.colors.textMuted}
      accessibilityLabel="Family name"
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
