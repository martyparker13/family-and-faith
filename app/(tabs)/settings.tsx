import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import { useDailyContent } from '@/store/daily-content';
import { useProgress } from '@/store/progress';
import { useSettings, type AppLanguage, type SpeechRate, type ThemePreference } from '@/store/settings';

const REMINDER_OPTIONS: { label: string; value: { hour: number; minute: number } | null }[] = [
  { label: '7:00 AM', value: { hour: 7, minute: 0 } },
  { label: '8:00 AM', value: { hour: 8, minute: 0 } },
  { label: '12:00 PM', value: { hour: 12, minute: 0 } },
  { label: '6:00 PM', value: { hour: 18, minute: 0 } },
  { label: '7:30 PM', value: { hour: 19, minute: 30 } },
  { label: '8:30 PM', value: { hour: 20, minute: 30 } },
];

export default function SettingsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const settings = useSettings();
  const [name, setName] = useState(settings.familyName);

  const THEME_OPTIONS: { label: string; value: ThemePreference }[] = [
    { label: t('settings.theme_system'), value: 'system' },
    { label: t('settings.theme_light'),  value: 'light' },
    { label: t('settings.theme_dark'),   value: 'dark' },
  ];

  const SPEECH_RATE_OPTIONS: { label: string; value: SpeechRate }[] = [
    { label: t('settings.speed_slow'),   value: 'slow' },
    { label: t('settings.speed_normal'), value: 'normal' },
    { label: t('settings.speed_fast'),   value: 'fast' },
  ];

  const LANGUAGE_OPTIONS: { label: string; value: AppLanguage }[] = [
    { label: t('settings.lang_auto'), value: 'system' },
    { label: t('settings.lang_en'),   value: 'en' },
    { label: t('settings.lang_es'),   value: 'es' },
  ];

  const reminderOptions = [
    ...REMINDER_OPTIONS.map((o) => ({ ...o })),
    { label: t('settings.reminder_off_label'), value: null },
  ];

  const reminderLabel = settings.reminder
    ? REMINDER_OPTIONS.find(
        (o) =>
          o.value?.hour === settings.reminder?.hour &&
          o.value?.minute === settings.reminder?.minute
      )?.label ?? 'Custom'
    : t('settings.reminder_off_label');

  const pickReminder = async (option: (typeof reminderOptions)[number]) => {
    if (option.value) {
      const allowed = await requestNotificationPermission();
      if (!allowed) {
        Alert.alert(t('settings.notifications_off_title'), t('settings.notifications_off_message'));
        return;
      }
    }
    await scheduleDailyReminder(option.value);
    settings.setReminder(option.value);
  };

  const restartPlan = () => {
    Alert.alert(
      t('settings.restart_confirm_title'),
      t('settings.restart_confirm_message'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('settings.restart_confirm_ok'), style: 'destructive', onPress: () => settings.setPlanStartDate(todayISO()) },
      ]
    );
  };

  const resetProgressConfirm = () => {
    Alert.alert(
      t('settings.reset_confirm_title'),
      t('settings.reset_confirm_message'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.reset_confirm_ok'),
          style: 'destructive',
          onPress: () => {
            useProgress.getState().resetProgress();
            useDailyContent.getState().resetDailyContent();
          },
        },
      ]
    );
  };

  const clearCacheConfirm = () => {
    Alert.alert(t('settings.clear_confirm_title'), t('settings.clear_confirm_message'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.clear_confirm_ok'),
        style: 'destructive',
        onPress: async () => {
          const removed = await clearBibleCache();
          Alert.alert(t('settings.cache_cleared_title'), t('settings.cache_cleared_message', { count: removed }));
        },
      },
    ]);
  };

  return (
    <Screen contentStyle={{ paddingTop: insets.top + theme.spacing.lg }}>
      <AppText variant="heading" semiBold accessibilityRole="header">
        {t('settings.title')}
      </AppText>

      <SectionLabel>{t('settings.family_name')}</SectionLabel>
      <TextInput
        value={name}
        onChangeText={setName}
        onEndEditing={() => settings.setFamilyName(name.trim())}
        placeholder={t('settings.family_name_placeholder')}
        placeholderTextColor={theme.colors.textMuted}
        accessibilityLabel={t('settings.family_name')}
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

      <SectionLabel>{t('settings.language')}</SectionLabel>
      <OptionRow
        options={LANGUAGE_OPTIONS.map((o) => o.label)}
        selectedIndex={LANGUAGE_OPTIONS.findIndex((o) => o.value === settings.language)}
        onSelect={(i) => settings.setLanguage(LANGUAGE_OPTIONS[i].value)}
      />

      <SectionLabel>{t('settings.appearance')}</SectionLabel>
      <OptionRow
        options={THEME_OPTIONS.map((o) => o.label)}
        selectedIndex={THEME_OPTIONS.findIndex((o) => o.value === settings.themePreference)}
        onSelect={(i) => settings.setThemePreference(THEME_OPTIONS[i].value)}
      />

      <SectionLabel>{t('settings.text_size')}</SectionLabel>
      <View style={{ alignItems: 'flex-start' }}>
        <TextSizeControl />
      </View>

      <SectionLabel>{t('settings.read_aloud_speed')}</SectionLabel>
      <OptionRow
        options={SPEECH_RATE_OPTIONS.map((o) => o.label)}
        selectedIndex={SPEECH_RATE_OPTIONS.findIndex((o) => o.value === settings.speechRate)}
        onSelect={(i) => settings.setSpeechRate(SPEECH_RATE_OPTIONS[i].value)}
      />

      <SectionLabel>{t('settings.reminder_section', { time: reminderLabel })}</SectionLabel>
      <OptionRow
        options={reminderOptions.map((o) => o.label)}
        selectedIndex={reminderOptions.findIndex((o) => o.label === reminderLabel)}
        onSelect={(i) => pickReminder(reminderOptions[i])}
      />

      <SectionLabel>{t('settings.reading_plan')}</SectionLabel>
      <View style={{ gap: theme.spacing.md }}>
        <Card onPress={restartPlan} accessibilityLabel={t('settings.restart_plan_title')}>
          <AppText variant="body" semiBold>
            {t('settings.restart_plan_title')}
          </AppText>
          <AppText variant="small" color={theme.colors.textMuted} style={{ marginTop: 2 }}>
            {t('settings.restart_plan_subtitle', { date: settings.planStartDate ?? '—' })}
          </AppText>
        </Card>
        <Card
          onPress={() => {
            settings.replayOnboarding();
            router.replace('/onboarding');
          }}
          accessibilityLabel={t('settings.replay_onboarding_title')}
        >
          <AppText variant="body" semiBold>
            {t('settings.replay_onboarding_title')}
          </AppText>
          <AppText variant="small" color={theme.colors.textMuted} style={{ marginTop: 2 }}>
            {t('settings.replay_onboarding_subtitle')}
          </AppText>
        </Card>
        <Card onPress={resetProgressConfirm} accessibilityLabel={t('settings.reset_progress_title')}>
          <AppText variant="body" semiBold color={theme.colors.danger}>
            {t('settings.reset_progress_title')}
          </AppText>
          <AppText variant="small" color={theme.colors.textMuted} style={{ marginTop: 2 }}>
            {t('settings.reset_progress_subtitle')}
          </AppText>
        </Card>
        <Card onPress={clearCacheConfirm} accessibilityLabel={t('settings.clear_cache_title')}>
          <AppText variant="body" semiBold>
            {t('settings.clear_cache_title')}
          </AppText>
          <AppText variant="small" color={theme.colors.textMuted} style={{ marginTop: 2 }}>
            {t('settings.clear_cache_subtitle')}
          </AppText>
        </Card>
      </View>

      <SectionLabel>{t('settings.offline')}</SectionLabel>
      <DownloadAheadCard planStartDate={settings.planStartDate} />

      <SectionLabel>{t('settings.about')}</SectionLabel>
      <Card>
        <AppText variant="small" color={theme.colors.textMuted}>
          {t('settings.about_text')}
        </AppText>
      </Card>
    </Screen>
  );
}

function DownloadAheadCard({ planStartDate }: { planStartDate: string | null }) {
  const { t } = useTranslation();
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
    ? t('settings.downloading', { done: progress?.done ?? 0, total: progress?.total ?? 0 })
    : finished
      ? t('settings.download_done', { done: progress.done, total: progress.total })
      : t('settings.download_button');

  return (
    <Card
      onPress={running ? undefined : start}
      accessibilityLabel={t('settings.download_button')}
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
            {t('settings.download_subtitle')}
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
