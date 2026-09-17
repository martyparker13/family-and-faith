import React, { useState } from 'react';
import { Modal, TextInput, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { AppText } from '@/components/AppText';
import { useTranslation } from '@/i18n/context';
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
  const { t } = useTranslation();
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
            {t('journal.logQuestionTitle')}
          </AppText>
          <AppText variant="small" color={theme.colors.textMuted} style={{ marginTop: theme.spacing.xs }}>
            {t('journal.logQuestionSubtitle', { day })}
          </AppText>
          <TextInput
            value={question}
            onChangeText={(text) => {
              setQuestion(text);
              setError(null);
            }}
            placeholder={t('journal.logQuestionPlaceholder')}
            placeholderTextColor={theme.colors.textMuted}
            multiline
            autoFocus
            accessibilityLabel={t('common.kidQuestionA11y')}
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
            <AppButton label={t('common.cancel')} variant="secondary" onPress={onClose} style={{ flex: 1 }} />
            <AppButton label={t('common.saveQuestion')} onPress={save} style={{ flex: 1 }} />
          </View>
        </View>
      </View>
    </Modal>
  );
}
