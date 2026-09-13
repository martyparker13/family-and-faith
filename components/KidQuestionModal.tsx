import React, { useState } from 'react';
import { Modal, TextInput, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { AppText } from '@/components/AppText';
import { useTheme } from '@/lib/theme-context';
import { validateKidQuestion } from '@/store/kid-questions';

/** Quick capture modal for a kid's question during reading or devotional. */
export function KidQuestionModal({
  visible,
  day,
  onClose,
  onSave,
}: {
  visible: boolean;
  day: number;
  onClose: () => void;
  onSave: (question: string) => void;
}) {
  const theme = useTheme();
  const [question, setQuestion] = useState('');
  const [error, setError] = useState<string | null>(null);

  const save = () => {
    const validationError = validateKidQuestion(question);
    if (validationError) {
      setError(validationError);
      return;
    }
    onSave(question.trim());
    setQuestion('');
    setError(null);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.4)',
          justifyContent: 'flex-end',
        }}
      >
        <View
          style={{
            backgroundColor: theme.colors.background,
            borderTopLeftRadius: theme.radius.lg,
            borderTopRightRadius: theme.radius.lg,
            padding: theme.spacing.lg,
          }}
        >
          <AppText variant="heading" semiBold accessibilityRole="header">
            Log a question
          </AppText>
          <AppText variant="small" color={theme.colors.textMuted} style={{ marginTop: theme.spacing.xs }}>
            Day {day} — save what a child wondered so you can revisit it later.
          </AppText>
          <TextInput
            value={question}
            onChangeText={(t) => {
              setQuestion(t);
              setError(null);
            }}
            placeholder="What did someone ask?"
            placeholderTextColor={theme.colors.textMuted}
            multiline
            autoFocus
            accessibilityLabel="Kid question"
            style={{
              minHeight: 88,
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
          {error ? (
            <AppText variant="small" color={theme.colors.danger} style={{ marginTop: theme.spacing.xs }}>
              {error}
            </AppText>
          ) : null}
          <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.md }}>
            <AppButton label="Cancel" variant="secondary" onPress={onClose} style={{ flex: 1 }} />
            <AppButton label="Save question" onPress={save} style={{ flex: 1 }} />
          </View>
        </View>
      </View>
    </Modal>
  );
}
