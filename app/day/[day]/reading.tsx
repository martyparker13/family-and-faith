import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as Speech from 'expo-speech';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { CompleteActivityButton } from '@/components/CompleteActivityButton';
import { DayNavigator } from '@/components/DayNavigator';
import { Screen } from '@/components/Screen';
import { TextSizeControl } from '@/components/TextSizeControl';
import { fetchPassageGroup, groupByChapter, type PassageText } from '@/lib/bible';
import { getPlanDay } from '@/lib/content';
import { dateForPlanDay, formatShortDate } from '@/lib/dates';
import { useTheme } from '@/lib/theme-context';
import { SPEECH_RATES, useSettings, useTextScale } from '@/store/settings';

/**
 * Feature 1 — Daily Reading screen.
 * Shows the day's passages (WEB text from bible-api.com, cached for offline),
 * a kid-friendly recap, adjustable text size, read-aloud, and mark-complete.
 */
export default function ReadingScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ day: string }>();
  const day = Math.min(365, Math.max(1, parseInt(params.day ?? '1', 10) || 1));
  const plan = getPlanDay(day);

  const planStartDate = useSettings((s) => s.planStartDate);
  const speechRate = useSettings((s) => s.speechRate);
  const textScale = useTextScale();

  // Per-day results cache: either the loaded passages or an error message.
  // Days stay in memory while the screen is mounted, so stepping back and
  // forth between days is instant.
  const [results, setResults] = useState<
    Record<number, { passages: PassageText[] } | { error: string }>
  >({});
  // Index into the utterance queue currently being read aloud (null = idle).
  const [speakIndex, setSpeakIndex] = useState<number | null>(null);
  const speaking = speakIndex !== null;

  const result = results[day];
  const passages = result && 'passages' in result ? result.passages : null;
  const error = result && 'error' in result ? result.error : null;

  /**
   * The read-aloud queue: kid recap, then each chapter heading and verse as
   * its own utterance so the current verse can be highlighted as it's read.
   */
  const utterances = useMemo(() => {
    if (!passages) return [];
    const list: { key: string; text: string }[] = [{ key: 'summary', text: plan.kidSummary }];
    for (const passage of passages) {
      for (const group of groupByChapter(passage)) {
        list.push({ key: `heading-${group.chapter}`, text: group.chapter });
        for (const v of group.verses) {
          list.push({ key: `${group.chapter}:${v.verse}`, text: v.text });
        }
      }
    }
    return list;
  }, [passages, plan]);

  const retry = useCallback(() => {
    setResults((r) => {
      const next = { ...r };
      delete next[day];
      return next;
    });
  }, [day]);

  useEffect(() => {
    if (results[day]) return;
    let cancelled = false;
    Promise.all(plan.passages.map((p) => fetchPassageGroup(p.reference, p.apiQueries)))
      .then((loaded) => {
        if (!cancelled) setResults((r) => ({ ...r, [day]: { passages: loaded } }));
      })
      .catch((e: Error) => {
        if (!cancelled) setResults((r) => ({ ...r, [day]: { error: e.message } }));
      });
    return () => {
      cancelled = true;
    };
  }, [day, plan, results]);

  // Stop any in-progress narration when the day changes or screen unmounts.
  useEffect(() => {
    return () => {
      Speech.stop();
      setSpeakIndex(null);
    };
  }, [day]);

  // Speaks one utterance per index so the current verse can be highlighted;
  // advancing (or finishing) happens in the speech callbacks.
  useEffect(() => {
    if (speakIndex === null || speakIndex >= utterances.length) return;
    Speech.speak(utterances[speakIndex].text, {
      rate: SPEECH_RATES[speechRate],
      onDone: () =>
        setSpeakIndex((prev) =>
          prev === null || prev + 1 >= utterances.length ? null : prev + 1
        ),
      onStopped: () => setSpeakIndex(null),
      onError: () => setSpeakIndex(null),
    });
  }, [speakIndex, utterances, speechRate]);

  const speakingKey =
    speakIndex !== null && speakIndex < utterances.length ? utterances[speakIndex].key : null;

  const toggleReadAloud = () => {
    if (speaking) {
      Speech.stop();
      setSpeakIndex(null);
      return;
    }
    if (utterances.length > 0) setSpeakIndex(0);
  };

  const dayDate = planStartDate ? formatShortDate(dateForPlanDay(planStartDate, day)) : null;

  return (
    <Screen bottomPadding={96}>
      <DayNavigator
        day={day}
        subtitle={dayDate ?? undefined}
        onChange={(next) => router.setParams({ day: String(next) })}
      />

      {/* For Kids recap */}
      <Card accent={theme.colors.gold} style={{ marginTop: theme.spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
          <Ionicons name="happy" size={20} color={theme.colors.goldDeep} />
          <AppText variant="caption" bold scaled={false} color={theme.colors.goldDeep}>
            FOR KIDS
          </AppText>
        </View>
        <AppText variant="bodyLarge" style={{ marginTop: theme.spacing.sm }}>
          {plan.kidSummary}
        </AppText>
      </Card>

      {/* Controls */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginVertical: theme.spacing.lg,
        }}
      >
        <TextSizeControl />
        <Pressable
          onPress={toggleReadAloud}
          accessibilityRole="button"
          accessibilityLabel={speaking ? 'Stop reading aloud' : 'Read aloud'}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.spacing.sm,
            backgroundColor: speaking ? theme.colors.gold : theme.colors.surface,
            borderWidth: 1,
            borderColor: speaking ? theme.colors.gold : theme.colors.border,
            borderRadius: theme.radius.pill,
            paddingHorizontal: theme.spacing.lg,
            minHeight: theme.minTouch,
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <Ionicons
            name={speaking ? 'stop' : 'volume-high'}
            size={20}
            color={speaking ? theme.colors.onAccent : theme.colors.goldDeep}
          />
          <AppText
            variant="small"
            semiBold
            scaled={false}
            color={speaking ? theme.colors.onAccent : theme.colors.text}
          >
            {speaking ? 'Stop' : 'Read aloud'}
          </AppText>
        </Pressable>
      </View>

      {/* Passage text */}
      {error ? (
        <Card>
          <AppText variant="body" center color={theme.colors.danger}>
            {error}
          </AppText>
          <AppButton
            label="Try again"
            variant="secondary"
            onPress={retry}
            style={{ marginTop: theme.spacing.lg }}
          />
        </Card>
      ) : !passages ? (
        <View style={{ paddingVertical: theme.spacing.xxxl, alignItems: 'center' }}>
          <ActivityIndicator color={theme.colors.gold} size="large" />
          <AppText variant="small" color={theme.colors.textMuted} style={{ marginTop: theme.spacing.md }}>
            Loading today’s reading…
          </AppText>
        </View>
      ) : (
        passages.map((passage) => (
          <View key={passage.reference} style={{ marginBottom: theme.spacing.xl }}>
            {groupByChapter(passage).map((group) => (
              <View key={group.chapter} style={{ marginBottom: theme.spacing.lg }}>
                <AppText
                  variant="heading"
                  serif
                  semiBold
                  accessibilityRole="header"
                  style={{ marginBottom: theme.spacing.md }}
                >
                  {group.chapter}
                </AppText>
                <AppText variant="scripture">
                  {group.verses.map((v) => {
                    const verseKey = `${group.chapter}:${v.verse}`;
                    const isBeingRead = speakingKey === verseKey;
                    return (
                      <AppText
                        key={verseKey}
                        variant="scripture"
                        // Gentle highlight follows the narration verse by verse.
                        style={isBeingRead ? { backgroundColor: 'rgba(201, 151, 59, 0.28)' } : undefined}
                      >
                        <AppText
                          variant="caption"
                          scaled
                          color={theme.colors.goldDeep}
                          // Match the surrounding scripture line height: a nested
                          // span with a smaller lineHeight shrinks the whole
                          // line box on iOS and clips the tops of tall letters.
                          style={{
                            fontFamily: theme.fonts.sansBold,
                            lineHeight: theme.lineHeights.scripture * textScale,
                          }}
                        >
                          {` ${v.verse} `}
                        </AppText>
                        {v.text}
                      </AppText>
                    );
                  })}
                </AppText>
              </View>
            ))}
          </View>
        ))
      )}

      {/* Mark complete */}
      <View style={{ marginTop: theme.spacing.lg }}>
        <CompleteActivityButton activity="reading" day={day} />
      </View>
      <AppText variant="caption" center style={{ marginTop: theme.spacing.md }}>
        World English Bible (WEB) — public domain
      </AppText>
    </Screen>
  );
}
