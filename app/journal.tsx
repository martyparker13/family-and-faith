import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { SectionLabel } from '@/components/SectionLabel';
import { currentPlanDay, todayISO } from '@/lib/dates';
import { useTheme } from '@/lib/theme-context';
import { useJournal } from '@/store/journal';
import { useSettings } from '@/store/settings';

/**
 * The family Bible journal: one line per day about what the family read,
 * talked about, or prayed. Opens to today's entry (or a specific day when
 * navigated from a devotional) with the full history below.
 */
export default function JournalScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ day?: string }>();
  const planStartDate = useSettings((s) => s.planStartDate);

  const today = todayISO();
  const defaultDay = planStartDate ? currentPlanDay(planStartDate, today) : 1;
  const day = Math.min(365, Math.max(1, parseInt(params.day ?? '', 10) || defaultDay));

  const entries = useJournal((s) => s.entries);
  const saveEntry = useJournal((s) => s.saveEntry);
  const [note, setNote] = useState(entries[day]?.note ?? '');
  const [saved, setSaved] = useState(false);

  const history = Object.values(entries)
    .filter((e) => e.day !== day)
    .sort((a, b) => b.day - a.day);

  const save = () => {
    saveEntry(day, note, today);
    setSaved(true);
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Family Journal' }} />

      <SectionLabel>{`Day ${day} — what did we talk about?`}</SectionLabel>
      <Card accent={theme.colors.gold}>
        <TextInput
          value={note}
          onChangeText={(text) => {
            setNote(text);
            setSaved(false);
          }}
          placeholder="One line is plenty: something someone said, noticed, or prayed…"
          placeholderTextColor={theme.colors.textMuted}
          multiline
          accessibilityLabel={`Journal note for day ${day}`}
          style={{
            minHeight: 100,
            textAlignVertical: 'top',
            color: theme.colors.text,
            fontFamily: theme.fonts.sans,
            fontSize: theme.fontSizes.bodyLarge,
            lineHeight: theme.lineHeights.bodyLarge,
          }}
        />
        <AppButton
          label={saved ? 'Saved ✓' : 'Save note'}
          icon={saved ? 'checkmark-circle' : 'create'}
          variant={saved ? 'secondary' : 'primary'}
          onPress={save}
          disabled={saved}
          style={{ marginTop: theme.spacing.md }}
        />
      </Card>

      <SectionLabel>Our story so far</SectionLabel>
      {history.length === 0 ? (
        <EmptyState
          icon="book-outline"
          title="The first page is yours"
          message="Add a line each day. A year from now, this will be one of your family's favorite things to read."
        />
      ) : (
        <View style={{ gap: theme.spacing.md }}>
          {history.map((entry) => (
            <HistoryCard key={entry.day} day={entry.day} note={entry.note} dateISO={entry.dateISO} />
          ))}
        </View>
      )}
    </Screen>
  );
}

function HistoryCard({ day, note, dateISO }: { day: number; note: string; dateISO: string }) {
  const theme = useTheme();
  const removeEntry = useJournal((s) => s.removeEntry);

  return (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <AppText variant="caption" bold scaled={false} color={theme.colors.goldDeep} style={{ flex: 1 }}>
          DAY {day} · {dateISO}
        </AppText>
        <Pressable
          onPress={() => removeEntry(day)}
          accessibilityRole="button"
          accessibilityLabel={`Delete journal note for day ${day}`}
          hitSlop={10}
        >
          <Ionicons name="trash-outline" size={18} color={theme.colors.textMuted} />
        </Pressable>
      </View>
      <AppText variant="body" style={{ marginTop: theme.spacing.xs }}>
        {note}
      </AppText>
    </Card>
  );
}
