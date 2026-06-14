import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { SectionLabel } from '@/components/SectionLabel';
import { TextSizeControl } from '@/components/TextSizeControl';
import { clearBibleCache } from '@/lib/bible';
import { currentPlanDay, todayISO } from '@/lib/dates';
import { requestNotificationPermission, scheduleDailyReminder } from '@/lib/notifications';
import { prefetchDays, type PrefetchProgress } from '@/lib/prefetch';
import { useTheme } from '@/lib/theme-context';
import { useProgress } from '@/store/progress';
import { useSettings, type SpeechRate, type ThemePreference } from '@/store/settings';

const REMINDER_OPTIONS: { label: string; value: { hour: number; minute: number } | null }[] = [
  { label: '7:00 AM', value: { hour: 7, minute: 0 } },
  { label: '8:00 AM', value: { hour: 8, minute: 0 } },
  { label: '12:00 PM', value: { hour: 12, minute: 0 } },
  { label: '6:00 PM', value: { hour: 18, minute: 0 } },
  { label: '7:30 PM', value: { hour: 19, minute: 30 } },
  { label: '8:30 PM', value: { hour: 20, minute: 30 } },
  { label: 'Off', value: null },
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

/** Settings: family name, appearance, text size, reminder, and plan restart. */
export default function SettingsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const settings = useSettings();
  const [name, setName] = useState(settings.familyName);

  const reminderLabel = settings.reminder
    ? REMINDER_OPTIONS.find(
        (o) =>
          o.value?.hour === settings.reminder?.hour && o.value?.minute === settings.reminder?.minute
      )?.label ?? 'Custom'
    : 'Off';

  const pickReminder = async (option: (typeof REMINDER_OPTIONS)[number]) => {
    if (option.value) {
      const allowed = await requestNotificationPermission();
      if (!allowed) {
        Alert.alert(
          'Notifications are off',
          'Enable notifications for Family & Faith in your device settings to get the daily reminder.'
        );
        return;
      }
    }
    await scheduleDailyReminder(option.value);
    settings.setReminder(option.value);
  };

  const restartPlan = () => {
    Alert.alert(
      'Restart the plan?',
      'Day 1 will become today. Your completed-day history stays saved.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Restart', style: 'destructive', onPress: () => settings.setPlanStartDate(todayISO()) },
      ]
    );
  };

  const resetProgressConfirm = () => {
    Alert.alert(
      'Reset all progress?',
      'Completed days, the streak, and memory-verse practice will be cleared. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset everything',
          style: 'destructive',
          onPress: () => useProgress.getState().resetProgress(),
        },
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

  return (
    <Screen contentStyle={{ paddingTop: insets.top + theme.spacing.lg }}>
      <AppText variant="heading" semiBold accessibilityRole="header">
        Settings
      </AppText>

      <SectionLabel>Family name</SectionLabel>
      <TextInput
        value={name}
        onChangeText={setName}
        onEndEditing={() => settings.setFamilyName(name.trim())}
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

      <SectionLabel>{`Daily reminder · currently ${reminderLabel}`}</SectionLabel>
      <OptionRow
        options={REMINDER_OPTIONS.map((o) => o.label)}
        selectedIndex={REMINDER_OPTIONS.findIndex((o) => o.label === reminderLabel)}
        onSelect={(i) => pickReminder(REMINDER_OPTIONS[i])}
      />

      <SectionLabel>Reading plan</SectionLabel>
      <View style={{ gap: theme.spacing.md }}>
        <Card onPress={restartPlan} accessibilityLabel="Restart the 365-day plan from today">
          <AppText variant="body" semiBold>
            Restart the plan from today
          </AppText>
          <AppText variant="small" color={theme.colors.textMuted} style={{ marginTop: 2 }}>
            Day 1 started {settings.planStartDate ?? '—'}. Restarting makes today Day 1 again.
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
          <AppText variant="small" color={theme.colors.textMuted} style={{ marginTop: 2 }}>
            Walk through family name, start date, and reminder again.
          </AppText>
        </Card>
        <Card onPress={resetProgressConfirm} accessibilityLabel="Reset all progress">
          <AppText variant="body" semiBold color={theme.colors.danger}>
            Reset all progress
          </AppText>
          <AppText variant="small" color={theme.colors.textMuted} style={{ marginTop: 2 }}>
            Clears completed days, streak history, and memory-verse practice. Cannot be undone.
          </AppText>
        </Card>
        <Card onPress={clearCacheConfirm} accessibilityLabel="Clear downloaded chapters">
          <AppText variant="body" semiBold>
            Clear downloaded chapters
          </AppText>
          <AppText variant="small" color={theme.colors.textMuted} style={{ marginTop: 2 }}>
            Frees space; readings will re-download when opened.
          </AppText>
        </Card>
      </View>

      <SectionLabel>Offline reading</SectionLabel>
      <DownloadAheadCard planStartDate={settings.planStartDate} />

      <SectionLabel>About</SectionLabel>
      <Card>
        <AppText variant="small" color={theme.colors.textMuted}>
          Family & Faith v1.0 · Scripture quotations are from the World English Bible (WEB),
          which is in the public domain. All your family’s progress, favorites, and prayers are
          stored only on this device.
        </AppText>
      </Card>
    </Screen>
  );
}

/** Caches the next 30 days of chapters for fully-offline reading. */
function DownloadAheadCard({ planStartDate }: { planStartDate: string | null }) {
  const theme = useTheme();
  const [progress, setProgress] = useState<PrefetchProgress | null>(null);
  const [running, setRunning] = useState(false);

  const start = async () => {
    if (running) return;
    setRunning(true);
    const day = planStartDate ? currentPlanDay(planStartDate, todayISO()) : 1;
    const result = await prefetchDays(day, 30, setProgress);
    setProgress(result);
    setRunning(false);
  };

  const finished = !running && progress !== null;
  const label = running
    ? `Downloading… ${progress ? `${progress.done} of ${progress.total} chapters` : ''}`
    : finished
      ? `Done — ${progress.done} of ${progress.total} chapters saved`
      : 'Download the next 30 days';

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
            name={finished ? 'checkmark-circle' : 'cloud-download'}
            size={24}
            color={finished ? theme.colors.success : theme.colors.goldDeep}
          />
        )}
        <View style={{ flex: 1 }}>
          <AppText variant="body" semiBold>
            {label}
          </AppText>
          <AppText variant="small" color={theme.colors.textMuted} style={{ marginTop: 2 }}>
            Saves upcoming chapters on this device so readings work without internet.
          </AppText>
        </View>
      </View>
    </Card>
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
            key={label}
            onPress={() => onSelect(i)}
            accessibilityRole="button"
            accessibilityLabel={label}
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
