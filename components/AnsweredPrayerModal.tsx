import React, { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, TextInput, View } from 'react-native';

import { AppButton } from './AppButton';
import { AppText } from './AppText';
import { useTheme } from '@/lib/theme-context';

interface AnsweredPrayerModalProps {
  /** Title of the prayer request being marked answered; null hides the modal. */
  requestTitle: string | null;
  onConfirm: (answeredNote: string) => void;
  onCancel: () => void;
}

/**
 * Cross-platform "How did God answer?" dialog (Alert.prompt is iOS-only).
 * The note is optional — families can simply celebrate and skip the details.
 */
export function AnsweredPrayerModal({
  requestTitle,
  onConfirm,
  onCancel,
}: AnsweredPrayerModalProps) {
  const theme = useTheme();
  const [note, setNote] = useState('');

  const confirm = () => {
    onConfirm(note.trim());
    setNote('');
  };
  const cancel = () => {
    setNote('');
    onCancel();
  };

  return (
    <Modal visible={requestTitle !== null} transparent animationType="fade" onRequestClose={cancel}>
      <Pressable
        onPress={cancel}
        accessibilityLabel="Close"
        style={{
          flex: 1,
          backgroundColor: theme.colors.scrim,
          justifyContent: 'center',
          padding: theme.spacing.xl,
        }}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {/* Stop taps inside the card from closing the modal. */}
          <Pressable
            onPress={() => {}}
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: theme.radius.lg,
              borderWidth: 2,
              borderColor: theme.colors.green,
              padding: theme.spacing.xl,
            }}
          >
            <AppText variant="title" semiBold center>
              Answered! 🙌
            </AppText>
            <AppText
              variant="body"
              center
              color={theme.colors.textMuted}
              style={{ marginTop: theme.spacing.xs }}
            >
              {`How did God answer "${requestTitle ?? ''}"? (optional)`}
            </AppText>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Tell the story in a sentence…"
              placeholderTextColor={theme.colors.textMuted}
              multiline
              accessibilityLabel="How God answered, optional"
              style={{
                marginTop: theme.spacing.lg,
                minHeight: 72,
                textAlignVertical: 'top',
                borderWidth: 1,
                borderColor: theme.colors.border,
                borderRadius: theme.radius.md,
                padding: theme.spacing.md,
                color: theme.colors.text,
                fontFamily: theme.fonts.sans,
                fontSize: theme.fontSizes.body,
                backgroundColor: theme.colors.surfaceAlt,
              }}
            />
            <View style={{ gap: theme.spacing.sm, marginTop: theme.spacing.lg }}>
              <AppButton label="Mark as answered" icon="sparkles" onPress={confirm} />
              <AppButton label="Not yet" variant="ghost" onPress={cancel} />
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}
