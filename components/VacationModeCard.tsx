import React, { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { useTranslation } from '@/i18n/context';
import { scheduleRhythmReminders } from '@/lib/notifications';
import { todayISO } from '@/lib/dates';
import { validateVacationMode, type VacationMode } from '@/lib/vacation-mode';
import { useTheme } from '@/lib/theme-context';
import { useSettings } from '@/store/settings';

function DateChip({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: string;
  onChange: (iso: string | undefined) => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <View style={{ flex: 1 }}>
      <AppText variant="caption" scaled={false} color={theme.colors.textMuted}>
        {label}
      </AppText>
      <Pressable
        onPress={() => {
          const today = todayISO();
          if (value === today) onChange(undefined);
          else onChange(today);
        }}
        accessibilityRole="button"
        style={({ pressed }) => ({
          marginTop: 4,
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.md,
          padding: theme.spacing.sm,
          backgroundColor: pressed ? theme.colors.surfaceAlt : theme.colors.surface,
        })}
      >
        <AppText variant="small" semiBold scaled={false}>
          {value ?? t('common.notSet')}
        </AppText>
      </Pressable>
    </View>
  );
}

/** Settings card for vacation / travel mode. */
export function VacationModeCard() {
  const theme = useTheme();
  const { t } = useTranslation();
  const vacationMode = useSettings((s) => s.vacationMode);
  const setVacationMode = useSettings((s) => s.setVacationMode);
  const resumeFromVacation = useSettings((s) => s.resumeFromVacation);
  const morningReminder = useSettings((s) => s.morningReminder);
  const dinnerReminder = useSettings((s) => s.dinnerReminder);
  const bedtimeReminder = useSettings((s) => s.bedtimeReminder);
  const [draft, setDraft] = useState<VacationMode>(vacationMode);

  const enable = async () => {
    const next: VacationMode = { ...draft, active: true, startDate: draft.startDate ?? todayISO() };
    const err = validateVacationMode(next);
    if (err) {
      Alert.alert(t('vacationMode.checkDatesTitle'), err);
      return;
    }
    setVacationMode(next);
    await scheduleRhythmReminders({ morning: null, dinner: null, bedtime: null });
  };

  const resume = async () => {
    resumeFromVacation();
    setDraft({ active: false });
    await scheduleRhythmReminders({
      morning: morningReminder,
      dinner: dinnerReminder,
      bedtime: bedtimeReminder,
    });
  };

  return (
    <Card accent={theme.colors.blue}>
      <AppText variant="body" semiBold>
        {t('vacationMode.title')}
      </AppText>
      <AppText variant="small" color={theme.colors.textMuted} style={{ marginTop: 4 }}>
        {t('vacationMode.description')}
      </AppText>

      {vacationMode.active ? (
        <View style={{ marginTop: theme.spacing.md, gap: theme.spacing.sm }}>
          <AppText variant="small" semiBold color={theme.colors.green}>
            {t('common.active')}
            {vacationMode.startDate ? t('common.since', { date: vacationMode.startDate }) : ''}
            {vacationMode.endDate ? t('common.until', { date: vacationMode.endDate }) : ''}
          </AppText>
          <AppButton label={t('common.resumeVacation')} icon="airplane" onPress={resume} />
        </View>
      ) : (
        <View style={{ marginTop: theme.spacing.md, gap: theme.spacing.md }}>
          <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
            <DateChip
              label={t('vacationMode.startOptional')}
              value={draft.startDate}
              onChange={(iso) => setDraft((d) => ({ ...d, startDate: iso }))}
            />
            <DateChip
              label={t('vacationMode.endOptional')}
              value={draft.endDate}
              onChange={(iso) => setDraft((d) => ({ ...d, endDate: iso }))}
            />
          </View>
          <AppButton label={t('common.turnOnVacation')} icon="airplane-outline" onPress={enable} />
        </View>
      )}
    </Card>
  );
}
