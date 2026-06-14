import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, TextInput, View } from 'react-native';

import { AnsweredPrayerModal } from '@/components/AnsweredPrayerModal';
import { AppButton } from '@/components/AppButton';
import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { SectionLabel } from '@/components/SectionLabel';
import { celebrationHaptics } from '@/lib/celebrate';
import { useTheme } from '@/lib/theme-context';
import { useCelebration } from '@/store/celebration';
import { usePrayerList, type PrayerRequest } from '@/store/prayer-list';

/**
 * The family prayer list: add requests, mark them answered, and revisit the
 * Answered Prayers history — a running record of God's faithfulness that
 * kids can watch grow.
 */
export default function PrayerListScreen() {
  const theme = useTheme();
  const requests = usePrayerList((s) => s.requests);
  const addRequest = usePrayerList((s) => s.addRequest);

  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');

  const active = requests.filter((r) => !r.answeredAt);
  const answered = requests.filter((r) => r.answeredAt);

  const submit = () => {
    if (!title.trim()) return;
    addRequest(title, note);
    setTitle('');
    setNote('');
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Prayer List' }} />

      {/* Add a request */}
      <Card style={{ marginTop: theme.spacing.lg }}>
        <AppText variant="title" semiBold>
          Add a prayer request
        </AppText>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Who or what are we praying for?"
          placeholderTextColor={theme.colors.textMuted}
          accessibilityLabel="Prayer request"
          style={{
            marginTop: theme.spacing.md,
            minHeight: theme.minTouch,
            borderWidth: 1,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.md,
            paddingHorizontal: theme.spacing.md,
            color: theme.colors.text,
            fontFamily: theme.fonts.sans,
            fontSize: theme.fontSizes.body,
            backgroundColor: theme.colors.surfaceAlt,
          }}
        />
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="Anything more? (optional)"
          placeholderTextColor={theme.colors.textMuted}
          accessibilityLabel="Details (optional)"
          style={{
            marginTop: theme.spacing.sm,
            minHeight: theme.minTouch,
            borderWidth: 1,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.md,
            paddingHorizontal: theme.spacing.md,
            color: theme.colors.text,
            fontFamily: theme.fonts.sans,
            fontSize: theme.fontSizes.body,
            backgroundColor: theme.colors.surfaceAlt,
          }}
        />
        <AppButton
          label="Add to our list"
          icon="add-circle"
          onPress={submit}
          disabled={!title.trim()}
          style={{ marginTop: theme.spacing.md }}
        />
      </Card>

      {/* Active requests */}
      <SectionLabel>We’re praying for</SectionLabel>
      {active.length === 0 ? (
        <EmptyState
          icon="rose-outline"
          title="No requests yet"
          message="Add the people and needs your family is praying for — then watch what God does."
        />
      ) : (
        <View style={{ gap: theme.spacing.md }}>
          {active.map((r) => (
            <RequestCard key={r.id} request={r} />
          ))}
        </View>
      )}

      {/* Answered prayers */}
      {answered.length > 0 && (
        <>
          <SectionLabel color={theme.colors.green}>Answered prayers 🎉</SectionLabel>
          <View style={{ gap: theme.spacing.md }}>
            {answered.map((r) => (
              <AnsweredCard key={r.id} request={r} />
            ))}
          </View>
        </>
      )}
    </Screen>
  );
}

function RequestCard({ request }: { request: PrayerRequest }) {
  const theme = useTheme();
  const markAnswered = usePrayerList((s) => s.markAnswered);
  const removeRequest = usePrayerList((s) => s.removeRequest);
  const fire = useCelebration((s) => s.fire);
  const [answering, setAnswering] = useState(false);

  const confirmAnswered = (note: string) => {
    setAnswering(false);
    markAnswered(request.id, note);
    fire({ message: '🙌 An answered prayer!', size: 'big' });
    celebrationHaptics('big');
  };

  const confirmRemove = () => {
    Alert.alert('Remove request?', `Remove "${request.title}" from the list?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeRequest(request.id) },
    ]);
  };

  return (
    <Card accent={theme.colors.blue}>
      <AppText variant="bodyLarge" semiBold>
        {request.title}
      </AppText>
      {request.note ? (
        <AppText variant="small" color={theme.colors.textMuted} style={{ marginTop: 2 }}>
          {request.note}
        </AppText>
      ) : null}
      <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.md }}>
        <Pressable
          onPress={() => setAnswering(true)}
          accessibilityRole="button"
          accessibilityLabel={`Mark "${request.title}" as answered`}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            backgroundColor: pressed ? theme.colors.surfaceAlt : 'transparent',
            borderWidth: 1,
            borderColor: theme.colors.green,
            borderRadius: theme.radius.pill,
            paddingHorizontal: theme.spacing.md,
            minHeight: theme.minTouch - 8,
          })}
        >
          <Ionicons name="checkmark-circle" size={20} color={theme.colors.green} />
          <AppText variant="small" semiBold scaled={false} color={theme.colors.green}>
            Answered!
          </AppText>
        </Pressable>
        <Pressable
          onPress={confirmRemove}
          accessibilityRole="button"
          accessibilityLabel={`Remove "${request.title}"`}
          hitSlop={8}
          style={({ pressed }) => ({
            alignItems: 'center',
            justifyContent: 'center',
            width: theme.minTouch - 8,
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <Ionicons name="trash-outline" size={20} color={theme.colors.danger} />
        </Pressable>
      </View>
      <AnsweredPrayerModal
        requestTitle={answering ? request.title : null}
        onConfirm={confirmAnswered}
        onCancel={() => setAnswering(false)}
      />
    </Card>
  );
}

function AnsweredCard({ request }: { request: PrayerRequest }) {
  const theme = useTheme();
  const reopenRequest = usePrayerList((s) => s.reopenRequest);
  const answeredDate = request.answeredAt
    ? new Date(request.answeredAt).toLocaleDateString(undefined, {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  return (
    <Card accent={theme.colors.green} style={{ backgroundColor: theme.colors.surfaceAlt }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
        <Ionicons name="sparkles" size={18} color={theme.colors.green} />
        <AppText variant="bodyLarge" semiBold style={{ flex: 1 }}>
          {request.title}
        </AppText>
      </View>
      {request.answeredNote ? (
        <AppText variant="body" style={{ marginTop: theme.spacing.xs }}>
          {request.answeredNote}
        </AppText>
      ) : null}
      <AppText variant="caption" scaled={false} style={{ marginTop: theme.spacing.xs }}>
        Answered {answeredDate}
      </AppText>
      <Pressable
        onPress={() => reopenRequest(request.id)}
        accessibilityRole="button"
        accessibilityLabel={`Move "${request.title}" back to the active list`}
        style={({ pressed }) => ({ marginTop: theme.spacing.sm, opacity: pressed ? 0.6 : 1 })}
      >
        <AppText variant="caption" semiBold scaled={false} color={theme.colors.blue}>
          Keep praying for this
        </AppText>
      </Pressable>
    </Card>
  );
}
