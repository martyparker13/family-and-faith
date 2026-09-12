import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { parentTipFor } from '@/lib/parent-tips';
import { celebrationHaptics } from '@/lib/celebrate';
import { todayISO } from '@/lib/dates';
import type { MemoryVerse } from '@/lib/memory-verse';
import { useTheme } from '@/lib/theme-context';
import { useCelebration } from '@/store/celebration';
import { useProgress } from '@/store/progress';

/** Tap-to-reveal memory verse practice with "say it together" prompt. */
export function MemoryVersePractice({ verse, day }: { verse: MemoryVerse; day: number }) {
  const theme = useTheme();
  const practiced = useProgress((s) => Boolean(s.practicedWeeks[verse.week]));
  const togglePracticed = useProgress((s) => s.togglePracticedWeek);
  const fire = useCelebration((s) => s.fire);

  const words = useMemo(() => verse.text.split(/\s+/), [verse.text]);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [showTogether, setShowTogether] = useState(false);

  const revealWord = (index: number) => {
    setRevealed((prev) => new Set(prev).add(index));
  };

  const revealAll = () => {
    setRevealed(new Set(words.map((_, i) => i)));
    setShowTogether(true);
  };

  const onPracticed = () => {
    togglePracticed(verse.week, todayISO());
    if (!practiced) {
      fire({ message: '📖 Hidden in your hearts!', size: 'small' });
      celebrationHaptics('small');
    }
  };

  return (
    <Card accent={theme.colors.blue}>
      <AppText variant="caption" bold scaled={false} color={theme.colors.goldDeep}>
        MEMORY VERSE PRACTICE
      </AppText>
      <AppText variant="small" color={theme.colors.textMuted} style={{ marginTop: theme.spacing.xs }}>
        Tap each hidden word to reveal it — then say it together.
      </AppText>

      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: theme.spacing.sm,
          marginTop: theme.spacing.md,
        }}
      >
        {words.map((word, i) => {
          const isRevealed = revealed.has(i);
          return (
            <Pressable
              key={`${word}-${i}`}
              onPress={() => revealWord(i)}
              accessibilityRole="button"
              accessibilityLabel={isRevealed ? word : 'Hidden word, tap to reveal'}
              style={({ pressed }) => ({
                backgroundColor: isRevealed
                  ? theme.colors.surface
                  : pressed
                    ? theme.colors.surfaceAlt
                    : theme.colors.border,
                borderRadius: theme.radius.sm,
                paddingHorizontal: theme.spacing.sm,
                paddingVertical: 4,
                minWidth: 44,
                alignItems: 'center',
              })}
            >
              <AppText variant="body" semiBold={isRevealed}>
                {isRevealed ? word : '•••'}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={revealAll}
        accessibilityRole="button"
        accessibilityLabel="Reveal all words"
        style={{ marginTop: theme.spacing.md }}
      >
        <AppText variant="small" semiBold color={theme.colors.blue}>
          Reveal all words
        </AppText>
      </Pressable>

      {showTogether || revealed.size === words.length ? (
        <View
          style={{
            marginTop: theme.spacing.lg,
            padding: theme.spacing.md,
            backgroundColor: theme.colors.surfaceAlt,
            borderRadius: theme.radius.md,
          }}
        >
          <AppText variant="body" semiBold>
            Say it together three times, then try it without looking.
          </AppText>
          <AppText variant="small" color={theme.colors.textMuted} style={{ marginTop: theme.spacing.sm }}>
            Tip: {parentTipFor('memory-verse', day)}
          </AppText>
        </View>
      ) : null}

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: theme.spacing.lg,
        }}
      >
        <AppText variant="small" semiBold color={theme.colors.goldDeep} style={{ flex: 1 }}>
          {verse.reference}
        </AppText>
        <Pressable
          onPress={onPracticed}
          accessibilityRole="button"
          accessibilityLabel={
            practiced ? 'Practiced this week — tap to undo' : 'Mark memory verse as practiced'
          }
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            borderWidth: 1,
            borderColor: practiced ? theme.colors.green : theme.colors.border,
            backgroundColor: practiced
              ? theme.colors.surfaceAlt
              : pressed
                ? theme.colors.surfaceAlt
                : 'transparent',
            borderRadius: theme.radius.pill,
            paddingHorizontal: theme.spacing.md,
            minHeight: theme.minTouch - 8,
          })}
        >
          <Ionicons
            name={practiced ? 'checkmark-circle' : 'mic-outline'}
            size={18}
            color={practiced ? theme.colors.green : theme.colors.textMuted}
          />
          <AppText
            variant="small"
            semiBold
            scaled={false}
            color={practiced ? theme.colors.green : theme.colors.text}
          >
            {practiced ? 'Practiced!' : 'We practiced it'}
          </AppText>
        </Pressable>
      </View>
    </Card>
  );
}
