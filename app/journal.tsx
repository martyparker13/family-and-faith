import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { copyAsync, documentDirectory } from 'expo-file-system/legacy';
import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
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
import { useTranslation } from '@/i18n/context';

/**
 * The family Bible journal: one line per day about what the family read,
 * talked about, or prayed. Opens to today's entry (or a specific day when
 * navigated from a devotional) with the full history below.
 */
export default function JournalScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ day?: string }>();
  const planStartDate = useSettings((s) => s.planStartDate);

  const today = todayISO();
  const defaultDay = planStartDate ? currentPlanDay(planStartDate, today) : 1;
  const day = Math.min(365, Math.max(1, parseInt(params.day ?? '', 10) || defaultDay));

  const entries = useJournal((s) => s.entries);
  const saveEntry = useJournal((s) => s.saveEntry);

  const history = Object.values(entries)
    .filter((e) => e.day !== day)
    .sort((a, b) => b.day - a.day);

  return (
    <Screen>
      <Stack.Screen options={{ title: t('navigation.familyJournal') }} />

      <SectionLabel>{t('journal.dayPrompt', { day })}</SectionLabel>
      <JournalEditor
        key={day}
        day={day}
        initialNote={entries[day]?.note ?? ''}
        initialVoiceUri={entries[day]?.voiceUri}
        initialVoiceDurationMs={entries[day]?.voiceDurationMs}
        onSave={(note, voice) => saveEntry(day, note, today, voice)}
      />

      <SectionLabel>{t('journal.storySoFar')}</SectionLabel>
      {history.length === 0 ? (
        <EmptyState
          icon="book-outline"
          title={t('journal.emptyTitle')}
          message={t('journal.emptyMessage')}
        />
      ) : (
        <View style={{ gap: theme.spacing.md }}>
          {history.map((entry) => (
            <HistoryCard key={entry.day} day={entry.day} note={entry.note} dateISO={entry.dateISO} voiceUri={entry.voiceUri} voiceDurationMs={entry.voiceDurationMs} />
          ))}
        </View>
      )}
    </Screen>
  );
}

function JournalEditor({
  day,
  initialNote,
  initialVoiceUri,
  initialVoiceDurationMs,
  onSave,
}: {
  day: number;
  initialNote: string;
  initialVoiceUri?: string;
  initialVoiceDurationMs?: number;
  onSave: (note: string, voice?: { voiceUri?: string; voiceDurationMs?: number }) => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [note, setNote] = useState(initialNote);
  const [saved, setSaved] = useState(false);
  const [mode, setMode] = useState<'text' | 'voice'>(initialVoiceUri ? 'voice' : 'text');
  const [voiceUri, setVoiceUri] = useState(initialVoiceUri);
  const [voiceDurationMs, setVoiceDurationMs] = useState(initialVoiceDurationMs);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const [recording, setRecording] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync().catch(() => {});
    };
  }, []);

  const save = () => {
    onSave(note, voiceUri ? { voiceUri, voiceDurationMs } : undefined);
    setSaved(true);
  };

  const startRecording = async () => {
    const perm = await Audio.requestPermissionsAsync();
    if (!perm.granted) return;
    await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
    const rec = new Audio.Recording();
    await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
    await rec.startAsync();
    recordingRef.current = rec;
    setRecording(true);
  };

  const stopRecording = async () => {
    const rec = recordingRef.current;
    if (!rec) return;
    await rec.stopAndUnloadAsync();
    const uri = rec.getURI();
    const status = await rec.getStatusAsync();
    recordingRef.current = null;
    setRecording(false);
    if (uri) {
      const dest = `${documentDirectory}journal-voice-${day}-${Date.now()}.m4a`;
      await copyAsync({ from: uri, to: dest });
      setVoiceUri(dest);
      setVoiceDurationMs(status.durationMillis ?? undefined);
      setSaved(false);
    }
  };

  const togglePlayback = async () => {
    if (!voiceUri) return;
    if (playing && soundRef.current) {
      await soundRef.current.stopAsync();
      setPlaying(false);
      return;
    }
    soundRef.current?.unloadAsync().catch(() => {});
    const { sound } = await Audio.Sound.createAsync({ uri: voiceUri });
    soundRef.current = sound;
    setPlaying(true);
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) setPlaying(false);
    });
    await sound.playAsync();
  };

  return (
    <Card accent={theme.colors.gold}>
      <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.md }}>
        <AppButton
          label={t('common.textMode')}
          variant={mode === 'text' ? 'primary' : 'secondary'}
          onPress={() => setMode('text')}
          style={{ flex: 1 }}
        />
        <AppButton
          label={t('common.voiceMode')}
          variant={mode === 'voice' ? 'primary' : 'secondary'}
          onPress={() => setMode('voice')}
          style={{ flex: 1 }}
        />
      </View>

      {mode === 'text' ? (
        <TextInput
          value={note}
          onChangeText={(text) => {
            setNote(text);
            setSaved(false);
          }}
          placeholder={t('journal.placeholder')}
          placeholderTextColor={theme.colors.textMuted}
          multiline
          accessibilityLabel={t('common.journalNoteA11y', { day })}
          style={{
            minHeight: 100,
            textAlignVertical: 'top',
            color: theme.colors.text,
            fontFamily: theme.fonts.sans,
            fontSize: theme.fontSizes.bodyLarge,
            lineHeight: theme.lineHeights.bodyLarge,
          }}
        />
      ) : (
        <View style={{ alignItems: 'center', gap: theme.spacing.md, paddingVertical: theme.spacing.md }}>
          <AppButton
            label={recording ? t('common.stopRecording') : voiceUri ? t('common.rerecord') : t('common.startRecording')}
            icon={recording ? 'stop-circle' : 'mic'}
            variant={recording ? 'secondary' : 'primary'}
            onPress={recording ? stopRecording : startRecording}
          />
          {voiceUri ? (
            <Pressable
              onPress={togglePlayback}
              accessibilityRole="button"
              accessibilityLabel={playing ? t('common.stopPlayback') : t('common.playVoiceNote')}
              style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}
            >
              <Ionicons name={playing ? 'pause-circle' : 'play-circle'} size={32} color={theme.colors.goldDeep} />
              <AppText variant="body" semiBold>
                {playing ? t('common.playing') : t('common.playVoiceNote')}
                {voiceDurationMs ? ` (${Math.round(voiceDurationMs / 1000)}s)` : ''}
              </AppText>
            </Pressable>
          ) : (
            <AppText variant="small" color={theme.colors.textMuted} center>
              {t('common.voiceNoteHint')}
            </AppText>
          )}
        </View>
      )}

      <AppButton
        label={saved ? t('common.saved') : t('common.saveNote')}
        icon={saved ? 'checkmark-circle' : 'create'}
        variant={saved ? 'secondary' : 'primary'}
        onPress={save}
        disabled={saved}
        style={{ marginTop: theme.spacing.md }}
      />
    </Card>
  );
}

function HistoryCard({
  day,
  note,
  dateISO,
  voiceUri,
  voiceDurationMs,
}: {
  day: number;
  note: string;
  dateISO: string;
  voiceUri?: string;
  voiceDurationMs?: number;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const removeEntry = useJournal((s) => s.removeEntry);

  return (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <AppText variant="caption" bold scaled={false} color={theme.colors.goldDeep} style={{ flex: 1 }}>
          {t('common.dayHistory', { day, date: dateISO })}
        </AppText>
        <Pressable
          onPress={() => removeEntry(day)}
          accessibilityRole="button"
          accessibilityLabel={t('common.deleteJournalA11y', { day })}
          hitSlop={10}
        >
          <Ionicons name="trash-outline" size={18} color={theme.colors.textMuted} />
        </Pressable>
      </View>
      {note ? (
        <AppText variant="body" style={{ marginTop: theme.spacing.xs }}>
          {note}
        </AppText>
      ) : null}
      {voiceUri ? (
        <AppText variant="small" color={theme.colors.textMuted} style={{ marginTop: theme.spacing.xs }}>
          {voiceDurationMs
            ? t('common.voiceNoteDuration', { seconds: Math.round(voiceDurationMs / 1000) })
            : t('common.voiceNote')}
        </AppText>
      ) : null}
    </Card>
  );
}
