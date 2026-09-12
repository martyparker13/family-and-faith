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
import { requestNotificationPermission, scheduleRhythmReminders } from '@/lib/notifications';
import { useTheme } from '@/lib/theme-context';
import {
  DEFAULT_REMINDERS,
  useSettings,
  type AgeBand,
  type ChildProfile,
  type ReminderTime,
} from '@/store/settings';

interface StartOption {
  label: string;
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

const RHYTHM_PRESETS: { label: string; times: Record<'morning' | 'dinner' | 'bedtime', ReminderTime | null> }[] = [
  {
    label: '7 AM · 6 PM · 8 PM',
    times: { morning: { hour: 7, minute: 0 }, dinner: { hour: 18, minute: 0 }, bedtime: { hour: 20, minute: 0 } },
  },
  {
    label: '8 AM · 6:30 PM · 8:30 PM',
    times: {
      morning: { hour: 8, minute: 0 },
      dinner: { hour: 18, minute: 30 },
      bedtime: { hour: 20, minute: 30 },
    },
  },
  { label: 'Reminders off', times: { morning: null, dinner: null, bedtime: null } },
];

const AGE_BANDS: { label: string; value: AgeBand }[] = [
  { label: 'Little (3–7)', value: 'little' },
  { label: 'Older (8–12)', value: 'older' },
  { label: 'Teen (13+)', value: 'teen' },
];

function formatTime({ hour, minute }: ReminderTime): string {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

/**
 * First-launch onboarding: family name, children, three-rhythm reminders,
 * and plan start date.
 */
export default function OnboardingScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const completeOnboarding = useSettings((s) => s.completeOnboarding);

  const [familyName, setFamilyName] = useState('');
  const [startIndex, setStartIndex] = useState(0);
  const [presetIndex, setPresetIndex] = useState(0);
  const [customTimes, setCustomTimes] = useState(DEFAULT_REMINDERS);
  const [useCustom, setUseCustom] = useState(false);
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [childBand, setChildBand] = useState<AgeBand>('little');

  const addChild = () => {
    setChildren((c) => [...c, { ageBand: childBand }]);
  };

  const begin = async () => {
    const times = useCustom
      ? customTimes
      : RHYTHM_PRESETS[presetIndex].times;
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
      planStartDate: START_OPTIONS[startIndex].date(),
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
          Faith & Family
        </AppText>
        <AppText variant="body" center color={theme.colors.textMuted} style={{ marginTop: theme.spacing.sm, maxWidth: 300 }}>
          Morning reading, dinner talk, bedtime prayer — a daily rhythm together.
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

      <SectionLabel>Who is in your family? (optional)</SectionLabel>
      <ChipRow
        options={AGE_BANDS.map((b) => b.label)}
        selected={AGE_BANDS.findIndex((b) => b.value === childBand)}
        onSelect={(i) => setChildBand(AGE_BANDS[i].value)}
      />
      <AppButton label="Add a child" variant="secondary" onPress={addChild} style={{ marginTop: theme.spacing.sm }} />
      {children.length > 0 ? (
        <AppText variant="small" color={theme.colors.textMuted} style={{ marginTop: theme.spacing.sm }}>
          {children.length} child profile{children.length === 1 ? '' : 's'} added — devotionals will match their ages.
        </AppText>
      ) : null}

      <SectionLabel>When does Day 1 begin?</SectionLabel>
      <ChipRow
        options={START_OPTIONS.map((o) => o.label)}
        selected={startIndex}
        onSelect={setStartIndex}
      />

      <SectionLabel>Your daily rhythm reminders</SectionLabel>
      <ChipRow
        options={[...RHYTHM_PRESETS.map((p) => p.label), 'Custom per slot']}
        selected={useCustom ? RHYTHM_PRESETS.length : presetIndex}
        onSelect={(i) => {
          if (i === RHYTHM_PRESETS.length) setUseCustom(true);
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
              label={slot.charAt(0).toUpperCase() + slot.slice(1)}
              value={customTimes[slot]}
              onChange={(t) => setCustomTimes((prev) => ({ ...prev, [slot]: t }))}
            />
          ))}
        </View>
      ) : null}

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

function CustomTimeRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: ReminderTime | null;
  onChange: (t: ReminderTime | null) => void;
}) {
  const theme = useTheme();
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
        onPress={() => onChange(value ? null : DEFAULT_REMINDERS[label.toLowerCase() as keyof typeof DEFAULT_REMINDERS] ?? { hour: 7, minute: 0 })}
        accessibilityRole="button"
      >
        <AppText variant="small" color={theme.colors.textMuted}>
          {value ? 'On' : 'Off'}
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
