import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Image, Pressable, TextInput, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { CompleteActivityButton } from '@/components/CompleteActivityButton';
import { DayNavigator } from '@/components/DayNavigator';
import { ExpandableCard } from '@/components/ExpandableCard';
import { KidQuestionModal } from '@/components/KidQuestionModal';
import { ParentTipBanner } from '@/components/ParentTipBanner';
import { Screen } from '@/components/Screen';
import { SectionLabel } from '@/components/SectionLabel';
import { TextSizeControl } from '@/components/TextSizeControl';
import { filterQuestions } from '@/lib/age-bands';
import { celebrationHaptics } from '@/lib/celebrate';
import { getDevotional } from '@/lib/content';
import { todayISO } from '@/lib/dates';
import { useTheme } from '@/lib/theme-context';
import { useCelebration } from '@/store/celebration';
import { useProgress } from '@/store/progress';
import { useSettings } from '@/store/settings';
import { useKidQuestions } from '@/store/kid-questions';
import { useTranslation } from '@/i18n/context';

/**
 * Daily Devotional — age-aware questions, family challenge tracking,
 * and parent lead tips.
 */
export default function DevotionalScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ day: string }>();
  const day = Math.min(365, Math.max(1, parseInt(params.day ?? '1', 10) || 1));
  const devotional = getDevotional(day);

  const children = useSettings((s) => s.children);
  const [showAll, setShowAll] = useState(false);
  const visibleQuestions = filterQuestions(devotional.questions, children, showAll);
  const littleQs = visibleQuestions.filter((q) => q.audience === 'little');
  const olderQs = visibleQuestions.filter((q) => q.audience === 'older');

  const challengeDone = useProgress((s) => Boolean(s.familyChallengesDone[day]));
  const challengeNote = useProgress((s) => s.familyChallengeNotes[day]);
  const toggleChallenge = useProgress((s) => s.toggleFamilyChallenge);
  const setFamilyChallengeNote = useProgress((s) => s.setFamilyChallengeNote);
  const fire = useCelebration((s) => s.fire);
  const addQuestion = useKidQuestions((s) => s.addQuestion);
  const [questionModalVisible, setQuestionModalVisible] = useState(false);
  const [captureNote, setCaptureNote] = useState(challengeNote?.note ?? '');

  const onChallengeDone = () => {
    toggleChallenge(day);
    if (!challengeDone) {
      if (captureNote.trim()) {
        setFamilyChallengeNote(day, { note: captureNote.trim() });
      }
      fire({ message: t('celebrations.familyChallenge'), size: 'small' });
      celebrationHaptics('small');
    }
  };

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setFamilyChallengeNote(day, { photoUri: result.assets[0].uri });
    }
  };

  return (
    <Screen>
      <DayNavigator
        day={day}
        subtitle={devotional.theme}
        onChange={(next) => router.setParams({ day: String(next) })}
      />

      <ParentTipBanner screen="devotional" day={day} />

      <AppButton
        label={t('common.shortOnTimeButton')}
        icon="timer-outline"
        variant="ghost"
        onPress={() => router.push(`/quick-evening?day=${day}`)}
        style={{ marginTop: theme.spacing.sm }}
      />

      <AppText
        variant="display"
        center
        accessibilityRole="header"
        style={{ marginTop: theme.spacing.xl }}
      >
        {devotional.title}
      </AppText>

      <Card accent={theme.colors.clay} style={{ marginTop: theme.spacing.lg }}>
        <AppText variant="scripture" italic>
          “{devotional.scripture.text}”
        </AppText>
        <AppText
          variant="small"
          semiBold
          color={theme.colors.goldDeep}
          style={{ marginTop: theme.spacing.sm }}
        >
          — {devotional.scripture.reference} {t('common.webShort')}
        </AppText>
      </Card>

      <View style={{ alignItems: 'flex-end', marginTop: theme.spacing.md }}>
        <TextSizeControl />
      </View>

      {devotional.reflection.split('\n\n').map((paragraph, i) => (
        <AppText key={i} variant="bodyLarge" style={{ marginTop: theme.spacing.lg }}>
          {paragraph}
        </AppText>
      ))}

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: theme.spacing.lg,
        }}
      >
        <SectionLabel color={theme.colors.clay}>{t('devotional.talkTogether')}</SectionLabel>
        {children.length > 0 ? (
          <Pressable onPress={() => setShowAll((v) => !v)} accessibilityRole="button">
            <AppText variant="small" semiBold color={theme.colors.goldDeep}>
              {showAll ? t('common.matchAges') : t('common.showAll')}
            </AppText>
          </Pressable>
        ) : null}
      </View>

      <View style={{ gap: theme.spacing.md }}>
        {littleQs.map((q, i) => (
          <ExpandableCard
            key={`little-${i}`}
            eyebrow={t('devotional.forLittleOnes')}
            eyebrowColor={theme.colors.green}
            title={t('common.question', { number: i + 1 })}
          >
            <AppText variant="bodyLarge">{q.question}</AppText>
          </ExpandableCard>
        ))}
        {olderQs.map((q, i) => (
          <ExpandableCard
            key={`older-${i}`}
            eyebrow={t('devotional.forOlderKidsParents')}
            eyebrowColor={theme.colors.blue}
            title={t('common.question', { number: littleQs.length + i + 1 })}
          >
            <AppText variant="bodyLarge">{q.question}</AppText>
          </ExpandableCard>
        ))}
      </View>

      <SectionLabel color={theme.colors.goldDeep}>{t('devotional.familyChallenge')}</SectionLabel>
      <Card accent={theme.colors.gold}>
        <View style={{ flexDirection: 'row', gap: theme.spacing.md, alignItems: 'flex-start' }}>
          <Ionicons name="star" size={24} color={theme.colors.gold} />
          <AppText variant="bodyLarge" style={{ flex: 1 }}>
            {devotional.familyChallenge}
          </AppText>
        </View>
        {!challengeDone ? (
          <>
            <TextInput
              value={captureNote}
              onChangeText={setCaptureNote}
              placeholder={t('devotional.challengePlaceholder')}
              placeholderTextColor={theme.colors.textMuted}
              multiline
              accessibilityLabel={t('common.familyChallengeNoteA11y')}
              style={{
                marginTop: theme.spacing.md,
                minHeight: 56,
                borderWidth: 1,
                borderColor: theme.colors.border,
                borderRadius: theme.radius.md,
                padding: theme.spacing.sm,
                color: theme.colors.text,
                fontFamily: theme.fonts.sans,
                fontSize: theme.fontSizes.body,
                textAlignVertical: 'top',
              }}
            />
            <AppButton
              label={t('common.addPhoto')}
              icon="camera-outline"
              variant="ghost"
              onPress={pickPhoto}
              style={{ marginTop: theme.spacing.sm }}
            />
          </>
        ) : null}
        {challengeNote?.photoUri ? (
          <Image
            source={{ uri: challengeNote.photoUri }}
            style={{
              width: '100%',
              height: 160,
              borderRadius: theme.radius.md,
              marginTop: theme.spacing.md,
            }}
            accessibilityLabel={t('common.familyChallengePhotoA11y')}
          />
        ) : null}
        {challengeDone && challengeNote?.note ? (
          <AppText variant="small" color={theme.colors.textMuted} style={{ marginTop: theme.spacing.sm }}>
            {challengeNote.note}
          </AppText>
        ) : null}
        <AppButton
          label={challengeDone ? t('common.challengeDoneUndo') : t('common.weDidChallenge')}
          icon={challengeDone ? 'checkmark-circle' : 'star-outline'}
          variant={challengeDone ? 'secondary' : 'primary'}
          onPress={onChallengeDone}
          style={{ marginTop: theme.spacing.lg }}
        />
      </Card>

      <View style={{ marginTop: theme.spacing.xl }}>
        <CompleteActivityButton activity="devotional" day={day} />
      </View>
      <AppButton
        label={t('common.logQuestion')}
        icon="help-circle-outline"
        variant="ghost"
        onPress={() => setQuestionModalVisible(true)}
        style={{ marginTop: theme.spacing.md }}
      />
      <AppButton
        label={t('common.writeJournal')}
        icon="create-outline"
        variant="ghost"
        onPress={() => router.push(`/journal?day=${day}`)}
        style={{ marginTop: theme.spacing.sm }}
      />

      <KidQuestionModal
        visible={questionModalVisible}
        day={day}
        onClose={() => setQuestionModalVisible(false)}
        onSave={(q) => addQuestion(day, q, todayISO())}
      />
    </Screen>
  );
}
