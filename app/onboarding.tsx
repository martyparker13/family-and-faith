import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Platform, Pressable, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/AppButton';
import { AppText } from '@/components/AppText';
import { Screen } from '@/components/Screen';
import { SectionLabel } from '@/components/SectionLabel';
import { useTranslation } from '@/i18n/context';
import { dateToISO, todayISO } from '@/lib/dates';
import { requestNotificationPermission, scheduleRhythmReminders } from '@/lib/notifications';
import { useTheme } from '@/lib/theme-context';
import {
  DEFAULT_REMINDERS,
  useSettings,
  type AgeBand,
  type AppLanguage,
  type ChildProfile,
  type ReminderTime,
} from '@/store/settings';

interface StartOption {
  labelKey: string;
  date: () => string;
}

const START_OPTION_KEYS: StartOption[] = [
  { labelKey: 'onboarding.startToday', date: () => todayISO() },
  {
    labelKey: 'onboarding.startTomorrow',
    date: () => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      return dateToISO(d);
    },
  },
  {
    labelKey: 'onboarding.startNextSunday',
    date: () => {
      const d = new Date();
      d.setDate(d.getDate() + ((7 - d.getDay()) % 7 || 7));
      return dateToISO(d);
    },
  },
  {
    labelKey: 'onboarding.startNextMonday',
    date: () => {
      const d = new Date();
      d.setDate(d.getDate() + ((8 - d.getDay()) % 7 || 7));
      return dateToISO(d);
    },
  },
];

const RHYTHM_PRESET_KEYS: { labelKey: string; times: Record<'morning' | 'dinner' | 'bedtime', ReminderTime | null> }[] = [
  {
    labelKey: 'onboarding.rhythmPreset1',
    times: { morning: { hour: 7, minute: 0 }, dinner: { hour: 18, minute: 0 }, bedtime: { hour: 20, minute: 0 } },
  },
  {
    labelKey: 'onboarding.rhythmPreset2',
    times: {
      morning: { hour: 8, minute: 0 },
      dinner: { hour: 18, minute: 30 },
      bedtime: { hour: 20, minute: 30 },
    },
  },
  { labelKey: 'onboarding.remindersOff', times: { morning: null, dinner: null, bedtime: null } },
];

const AGE_BAND_KEYS: { labelKey: string; value: AgeBand }[] = [
  { labelKey: 'onboarding.ageBandLittle', value: 'little' },
  { labelKey: 'onboarding.ageBandOlder', value: 'older' },
  { labelKey: 'onboarding.ageBandTeen', value: 'teen' },
];

const LANGUAGE_OPTIONS: { labelKey: string; value: AppLanguage }[] = [
  { labelKey: 'settings.languageDevice', value: 'device' },
  { labelKey: 'settings.languageEn', value: 'en' },
  { labelKey: 'settings.languageEs', value: 'es' },
];

function formatTime({ hour, minute }: ReminderTime): string {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

/**
 * First-launch onboarding: family name, children, three-rhythm reminders,
 * language, and plan start date.
 */
export default function OnboardingScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const completeOnboarding = useSettings((s) => s.completeOnboarding);
  const setLanguage = useSettings((s) => s.setLanguage);
  const savedLanguage = useSettings((s) => s.language);

  const [familyName, setFamilyName] = useState('');
  const [language, setLanguageChoice] = useState<AppLanguage>(savedLanguage);
  const [startIndex, setStartIndex] = useState(0);
  const [presetIndex, setPresetIndex] = useState(0);
  const [customTimes, setCustomTimes] = useState(DEFAULT_REMINDERS);
  const [useCustom, setUseCustom] = useState(false);
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [childBand, setChildBand] = useState<AgeBand>('little');

  const ageBands = AGE_BAND_KEYS.map((b) => ({ label: t(b.labelKey), value: b.value }));
  const languageOptions = LANGUAGE_OPTIONS.map((o) => ({ label: t(o.labelKey), value: o.value }));
  const startOptions = START_OPTION_KEYS.map((o) => ({ label: t(o.labelKey), date: o.date }));
  const rhythmPresets = RHYTHM_PRESET_KEYS.map((p) => ({ label: t(p.labelKey), times: p.times }));

  const addChild = () => {
    setChildren((c) => [...c, { ageBand: childBand }]);
  };

  const begin = async () => {
    setLanguage(language);
    const times = useCustom ? customTimes : rhythmPresets[presetIndex].times;
    const hasAnyReminder = times.morning || times.dinner || times.bedtime;
    let allowed = false;
    if (hasAnyReminder) {
      allowed = await requestNotificationPermission();
    }
    if (allowed) {
      await scheduleRhythmReminders({
        morning: times.morning,
        dinner: times.dinner,
        bedtime: times.bedtime,
      });
    }
    completeOnboarding({
      familyName: familyName.trim(),
      planStartDate: startOptions[startIndex].date(),
      morningReminder: allowed ? times.morning : null,
      dinnerReminder: allowed ? times.dinner : null,
      bedtimeReminder: allowed ? times.bedtime : null,
      children,
    });
    router.replace('/(tabs)');
  };

  return (
    <Screen contentStyle={{ paddingTop: insets.top + theme.spacing.xxl }}>
      <View style={{ alignItems: 'center', marginBottom: theme.spacing.xl }}>
        <View
          style={{
            width: 88,
            height: 88,
            borderRadius: 44,
            backgroundColor: theme.colors.surfaceAlt,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: theme.spacing.lg,
          }}
        >
          <Ionicons name="home" size={44} color={theme.colors.goldDeep} />
        </View>
        <AppText variant="display" center accessibilityRole="header">
          {t('onboarding.title')}
        </AppText>
        <AppText variant="body" center color={theme.colors.textMuted} style={{ marginTop: theme.spacing.sm, maxWidth: 300 }}>
          {t('onboarding.subtitle')}
        </AppText>
      </View>

      <SectionLabel>{t('settings.language')}</SectionLabel>
      <ChipRow
        options={languageOptions.map((o) => o.label)}
        selected={languageOptions.findIndex((o) => o.value === language)}
        onSelect={(i) => setLanguageChoice(languageOptions[i].value)}
      />

      <SectionLabel>{t('onboarding.familyNameSection')}</SectionLabel>
      <TextInput
        value={familyName}
        onChangeText={setFamilyName}
        placeholder={t('onboarding.familyNamePlaceholder')}
        placeholderTextColor={theme.colors.textMuted}
        accessibilityLabel={t('common.familyNameOptionalA11y')}
        style={{
          minHeight: theme.minTouch + 4,
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.md,
          paddingHorizontal: theme.spacing.lg,
          color: theme.colors.text,
          fontFamily: theme.fonts.sans,
          fontSize: theme.fontSizes.bodyLarge,
          backgroundColor: theme.colors.surface,
        }}
      />

      <SectionLabel>{t('onboarding.childrenSection')}</SectionLabel>
      <ChipRow
        options={ageBands.map((b) => b.label)}
        selected={ageBands.findIndex((b) => b.value === childBand)}
        onSelect={(i) => setChildBand(ageBands[i].value)}
      />
      <AppButton label={t('common.addAChild')} variant="secondary" onPress={addChild} style={{ marginTop: theme.spacing.sm }} />
      {children.length > 0 ? (
        <AppText variant="small" color={theme.colors.textMuted} style={{ marginTop: theme.spacing.sm }}>
          {t('common.childProfilesAdded', { count: children.length, plural: children.length === 1 ? '' : 's' })}
        </AppText>
      ) : null}

      <SectionLabel>{t('onboarding.planStartSection')}</SectionLabel>
      <ChipRow
        options={startOptions.map((o) => o.label)}
        selected={startIndex}
        onSelect={setStartIndex}
      />

      <SectionLabel>{t('onboarding.rhythmSection')}</SectionLabel>
      <ChipRow
        options={[...rhythmPresets.map((p) => p.label), t('common.customPerSlot')]}
        selected={useCustom ? rhythmPresets.length : presetIndex}
        onSelect={(i) => {
          if (i === rhythmPresets.length) setUseCustom(true);
          else {
            setUseCustom(false);
            setPresetIndex(i);
          }
        }}
      />

      {useCustom ? (
        <View style={{ marginTop: theme.spacing.md, gap: theme.spacing.sm }}>
          {(['morning', 'dinner', 'bedtime'] as const).map((slot) => (
            <CustomTimeRow
              key={slot}
              label={t(`rhythm.${slot}.short`)}
              slot={slot}
              value={customTimes[slot]}
              onChange={(time) => setCustomTimes((prev) => ({ ...prev, [slot]: time }))}
            />
          ))}
        </View>
      ) : null}

      <AppButton
        label={t('common.beginJourney')}
        icon="leaf"
        onPress={begin}
        style={{ marginTop: theme.spacing.xxl }}
        accessibilityHint={t('common.beginJourneyHint')}
      />
    </Screen>
  );
}

function CustomTimeRow({
  label,
  slot,
  value,
  onChange,
}: {
  label: string;
  slot: 'morning' | 'dinner' | 'bedtime';
  value: ReminderTime | null;
  onChange: (t: ReminderTime | null) => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [showPicker, setShowPicker] = useState(false);

  const onPick = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setShowPicker(false);
    if (event.type === 'set' && date) {
      onChange({ hour: date.getHours(), minute: date.getMinutes() });
    }
  };

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <AppText variant="body" semiBold>
        {label}
      </AppText>
      <Pressable
        onPress={() => onChange(value ? null : DEFAULT_REMINDERS[slot])}
        accessibilityRole="button"
      >
        <AppText variant="small" color={theme.colors.textMuted}>
          {value ? t('common.on') : t('common.off')}
        </AppText>
      </Pressable>
      {value ? (
        <Pressable onPress={() => setShowPicker(true)}>
          <AppText variant="small" semiBold color={theme.colors.goldDeep}>
            {formatTime(value)}
          </AppText>
        </Pressable>
      ) : null}
      {showPicker && value ? (
        <DateTimePicker
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'clock'}
          value={new Date(new Date().setHours(value.hour, value.minute, 0, 0))}
          onChange={onPick}
        />
      ) : null}
    </View>
  );
}

function ChipRow({
  options,
  selected,
  onSelect,
}: {
  options: string[];
  selected: number;
  onSelect: (index: number) => void;
}) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
      {options.map((label, i) => {
        const active = i === selected;
        return (
          <Pressable
            key={`${label}-${i}`}
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
