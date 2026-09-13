import React, { useState } from 'react';
import { TextInput, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { weekKeyForDate } from '@/lib/week-key';
import { useTheme } from '@/lib/theme-context';
import { useSettings } from '@/store/settings';

/** Sunday card: capture what the family heard at church. */
export function SundayBridgeCard({ todayISO }: { todayISO: string }) {
  const theme = useTheme();
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
        SUNDAY BRIDGE
      </AppText>
      <AppText variant="body" semiBold style={{ marginTop: theme.spacing.xs }}>
        What did we hear at church?
      </AppText>
      <AppText variant="small" color={theme.colors.textMuted} style={{ marginTop: 4 }}>
        One line from the sermon, a song, or something a child noticed — it shows up in your weekly recap.
      </AppText>
      <TextInput
        value={note}
        onChangeText={(t) => {
          setNote(t);
          setSaved(false);
        }}
        placeholder="e.g. God is faithful even when we are afraid…"
        placeholderTextColor={theme.colors.textMuted}
        multiline
        accessibilityLabel="Sunday church note"
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
          label={saved ? 'Saved ✓' : 'Save for this week'}
          variant={saved ? 'secondary' : 'primary'}
          onPress={save}
          disabled={saved}
        />
      </View>
    </Card>
  );
}
