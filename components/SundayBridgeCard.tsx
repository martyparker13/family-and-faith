import React, { useState } from 'react';
import { TextInput, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { useTranslation } from '@/i18n/context';
import { weekKeyForDate } from '@/lib/week-key';
import { useTheme } from '@/lib/theme-context';
import { useSettings } from '@/store/settings';

/** Sunday card: capture what the family heard at church. */
export function SundayBridgeCard({ todayISO }: { todayISO: string }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const weekKey = weekKeyForDate(todayISO);
  const savedNote = useSettings((s) => s.sundayNotes[weekKey] ?? '');
  const setSundayNote = useSettings((s) => s.setSundayNote);
  const [note, setNote] = useState(savedNote);
  const [saved, setSaved] = useState(false);

  const save = () => {
    setSundayNote(weekKey, note);
    setSaved(true);
  };

  return (
    <Card accent={theme.colors.gold} style={{ marginBottom: theme.spacing.md }}>
      <AppText variant="caption" bold scaled={false} color={theme.colors.goldDeep}>
        {t('sundayBridge.eyebrow')}
      </AppText>
      <AppText variant="body" semiBold style={{ marginTop: theme.spacing.xs }}>
        {t('sundayBridge.title')}
      </AppText>
      <AppText variant="small" color={theme.colors.textMuted} style={{ marginTop: 4 }}>
        {t('sundayBridge.description')}
      </AppText>
      <TextInput
        value={note}
        onChangeText={(text) => {
          setNote(text);
          setSaved(false);
        }}
        placeholder={t('sundayBridge.placeholder')}
        placeholderTextColor={theme.colors.textMuted}
        multiline
        accessibilityLabel={t('common.sundayNoteA11y')}
        style={{
          minHeight: 72,
          marginTop: theme.spacing.md,
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.md,
          padding: theme.spacing.md,
          color: theme.colors.text,
          fontFamily: theme.fonts.sans,
          fontSize: theme.fontSizes.body,
          textAlignVertical: 'top',
        }}
      />
      <View style={{ marginTop: theme.spacing.sm }}>
        <AppButton
          label={saved ? t('common.saved') : t('common.saveForWeek')}
          variant={saved ? 'secondary' : 'primary'}
          onPress={save}
          disabled={saved}
        />
      </View>
    </Card>
  );
}
