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
import { dateToISO, todayISO } from '@/lib/dates';
import { requestNotificationPermission, scheduleDailyReminder } from '@/lib/notifications';
import { useTheme } from '@/lib/theme-context';
import { useSettings } from '@/store/settings';

interface ReminderTime {
  hour: number;
  minute: number;
}

/** Preset reminder times; the final chip opens a native time picker. */
const REMINDER_PRESETS: { label: string; value: ReminderTime }[] = [
  { label: '7:00 AM', value: { hour: 7, minute: 0 } },
  { label: '8:00 AM', value: { hour: 8, minute: 0 } },
  { label: '12:00 PM', value: { hour: 12, minute: 0 } },
  { label: '6:00 PM', value: { hour: 18, minute: 0 } },
  { label: '7:30 PM', value: { hour: 19, minute: 30 } },
  { label: '8:30 PM', value: { hour: 20, minute: 30 } },
];

/** Index of the "Custom" chip (one past the presets). */
const CUSTOM_INDEX = REMINDER_PRESETS.length;

/** "9:15 PM" style label for a reminder time. */
function formatTime({ hour, minute }: ReminderTime): string {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

/** Converts a reminder time to a Date for the native picker. */
function timeToDate({ hour, minute }: ReminderTime): Date {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d;
}

interface StartOption {
  label: string;
  /** Returns the plan start date as local YYYY-MM-DD. */
  date: () => string;
}

const START_OPTIONS: StartOption[] = [
  { label: 'Today', date: () => todayISO() },
  {
    label: 'Tomorrow',
    date: () => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      return dateToISO(d);
    },
  },
  {
    label: 'Next Sunday',
    date: () => {
      const d = new Date();
      d.setDate(d.getDate() + ((7 - d.getDay()) % 7 || 7));
      return dateToISO(d);
    },
  },
  {
    label: 'Next Monday',
    date: () => {
      const d = new Date();
      d.setDate(d.getDate() + ((8 - d.getDay()) % 7 || 7));
      return dateToISO(d);
    },
  },
];

/**
 * First-launch onboarding: optional family name, daily reminder time, and
 * the start date for the 365-day plan (Day 1 is whenever the family begins).
 */
export default function OnboardingScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const completeOnboarding = useSettings((s) => s.completeOnboarding);

  const [familyName, setFamilyName] = useState('');
  const [reminderIndex, setReminderIndex] = useState(4); // 7:30 PM default
  const [startIndex, setStartIndex] = useState(0); // Today
  const [customTime, setCustomTime] = useState<ReminderTime>({ hour: 21, minute: 0 });
  // Android shows the time picker as a dialog; iOS renders it inline.
  const [showAndroidPicker, setShowAndroidPicker] = useState(false);

  const customSelected = reminderIndex === CUSTOM_INDEX;
  const reminderLabels = [
    ...REMINDER_PRESETS.map((o) => o.label),
    customSelected ? `Custom · ${formatTime(customTime)}` : 'Custom…',
  ];

  const pickReminder = (index: number) => {
    setReminderIndex(index);
    if (index === CUSTOM_INDEX && Platform.OS === 'android') {
      setShowAndroidPicker(true);
    }
  };

  const onPickTime = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setShowAndroidPicker(false);
    if (event.type === 'set' && date) {
      setCustomTime({ hour: date.getHours(), minute: date.getMinutes() });
    }
  };

  const begin = async () => {
    const reminder = customSelected ? customTime : REMINDER_PRESETS[reminderIndex].value;
    const allowed = await requestNotificationPermission();
    if (allowed) {
      await scheduleDailyReminder(reminder);
    }
    completeOnboarding({
      familyName: familyName.trim(),
      planStartDate: START_OPTIONS[startIndex].date(),
      reminder: allowed ? reminder : null,
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
          Faith & Family
        </AppText>
        <AppText variant="body" center color={theme.colors.textMuted} style={{ marginTop: theme.spacing.sm, maxWidth: 300 }}>
          A year of reading, talking, and praying through the Bible — together.
        </AppText>
      </View>

      <SectionLabel>What should we call your family? (optional)</SectionLabel>
      <TextInput
        value={familyName}
        onChangeText={setFamilyName}
        placeholder="e.g. The Parker Family"
        placeholderTextColor={theme.colors.textMuted}
        accessibilityLabel="Family name, optional"
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

      <SectionLabel>When does Day 1 begin?</SectionLabel>
      <ChipRow
        options={START_OPTIONS.map((o) => o.label)}
        selected={startIndex}
        onSelect={setStartIndex}
      />

      <SectionLabel>A gentle daily reminder?</SectionLabel>
      <ChipRow options={reminderLabels} selected={reminderIndex} onSelect={pickReminder} />

      {/* Custom time picker: inline spinner on iOS, dialog on Android. */}
      {customSelected && Platform.OS === 'ios' && (
        <View style={{ alignItems: 'center', marginTop: theme.spacing.sm }}>
          <DateTimePicker
            mode="time"
            display="spinner"
            value={timeToDate(customTime)}
            onChange={onPickTime}
            themeVariant={theme.scheme}
            accessibilityLabel="Pick a custom reminder time"
          />
        </View>
      )}
      {showAndroidPicker && (
        <DateTimePicker
          mode="time"
          display="clock"
          value={timeToDate(customTime)}
          onChange={onPickTime}
        />
      )}

      <AppButton
        label="Begin our journey"
        icon="leaf"
        onPress={begin}
        style={{ marginTop: theme.spacing.xxl }}
        accessibilityHint="Saves your choices and opens the Today screen"
      />
    </Screen>
  );
}

/** A wrapping row of selectable pill chips. */
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
