import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import React from 'react';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { SectionLabel } from '@/components/SectionLabel';
import { useTheme } from '@/lib/theme-context';
import { useKidQuestions } from '@/store/kid-questions';

/** List of kid questions captured during reading and devotional time. */
export default function KidQuestionsScreen() {
  const theme = useTheme();
  const questions = useKidQuestions((s) => s.questions);
  const removeQuestion = useKidQuestions((s) => s.removeQuestion);

  const sorted = [...questions].sort((a, b) => b.dateISO.localeCompare(a.dateISO) || b.day - a.day);

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Kid Questions' }} />

      <SectionLabel>Questions we wondered about</SectionLabel>
      {sorted.length === 0 ? (
        <EmptyState
          icon="help-circle-outline"
          title="No questions yet"
          message='Tap "Log a question" on a reading or devotional screen when a child wonders aloud.'
        />
      ) : (
        <View style={{ gap: theme.spacing.md }}>
          {sorted.map((q) => (
            <Card key={q.id}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <AppText variant="caption" bold scaled={false} color={theme.colors.goldDeep}>
                    DAY {q.day} · {q.dateISO}
                  </AppText>
                  <AppText variant="bodyLarge" style={{ marginTop: theme.spacing.xs }}>
                    {q.question}
                  </AppText>
                </View>
                <Pressable
                  onPress={() => removeQuestion(q.id)}
                  accessibilityRole="button"
                  accessibilityLabel="Delete question"
                  hitSlop={10}
                >
                  <Ionicons name="trash-outline" size={18} color={theme.colors.textMuted} />
                </Pressable>
              </View>
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}
