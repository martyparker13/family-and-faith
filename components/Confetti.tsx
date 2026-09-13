import React, { useEffect, useMemo, useState } from 'react';
import { Animated, Easing, StyleSheet, useWindowDimensions, View } from 'react-native';

import { AppText } from './AppText';
import { useTheme } from '@/lib/theme-context';

interface ConfettiProps {
  /** Increment to fire a new burst; 0 renders nothing. */
  burst: number;
  /** Optional celebration message shown in the middle of the burst. */
  message?: string | null;
  /** "big" doubles the pieces for milestone moments. */
  size?: 'small' | 'big';
}

interface Piece {
  startX: number;
  drift: number;
  /** Fraction of total duration before this piece starts falling (0–0.45). */
  delay: number;
  /** Fraction of total duration the piece takes to cross the screen (0.38–0.70). */
  speed: number;
  rotateTo: number;
  color: string;
  width: number;
  height: number;
}

/** Small deterministic PRNG so piece layout is a pure function of the burst. */
function mulberry32(seed: number): () => number {
  let t = seed;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * A lightweight, dependency-free confetti burst: colored paper pieces fall
 * from the top of the screen with staggered timing, drift, and spin, then
 * the overlay removes itself. Purely decorative — hidden from screen readers.
 */
export function Confetti({ burst, message, size = 'small' }: ConfettiProps) {
  const theme = useTheme();
  const { width, height } = useWindowDimensions();
  const [progress] = useState(() => new Animated.Value(0));
  const [finishedBurst, setFinishedBurst] = useState(0);

  const pieces: Piece[] = useMemo(() => {
    if (burst === 0) return [];
    const rand = mulberry32(burst * 9301 + 49297);
    const colors = [theme.colors.gold, theme.colors.blue, theme.colors.green, theme.colors.clay];
    const count = size === 'big' ? 80 : 40;
    return Array.from({ length: count }, (_, i) => ({
      startX: rand() * width,
      drift: (rand() - 0.5) * 220,
      delay: rand() * 0.45,
      speed: 0.38 + rand() * 0.32,
      rotateTo: (rand() - 0.5) * 900,
      color: colors[i % colors.length],
      width: 7 + rand() * 9,
      height: 10 + rand() * 12,
    }));
  }, [burst, size, width, theme]);

  useEffect(() => {
    if (burst === 0) return;
    progress.setValue(0);
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: 3200,
      easing: Easing.linear,
      useNativeDriver: true,
    });
    animation.start(({ finished }) => {
      if (finished) setFinishedBurst(burst);
    });
    return () => animation.stop();
  }, [burst, progress]);

  if (burst === 0 || burst === finishedBurst || pieces.length === 0) return null;

  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={StyleSheet.absoluteFill}
    >
      {pieces.map((piece, i) => {
        // Each piece has its own active window [p0, p1] within the 0→1 progress.
        // extrapolate:'clamp' keeps pieces off-screen before/after their window.
        const p0 = piece.delay;
        const p1 = Math.min(1.0, piece.delay + piece.speed);
        const pFade = p0 + (p1 - p0) * 0.72;

        const fall = progress.interpolate({
          inputRange: [p0, p1],
          outputRange: [-80, height + 80],
          extrapolate: 'clamp',
        });
        const sway = progress.interpolate({
          inputRange: [p0, p1],
          outputRange: [0, piece.drift],
          extrapolate: 'clamp',
        });
        const spin = progress.interpolate({
          inputRange: [p0, p1],
          outputRange: ['0deg', `${piece.rotateTo}deg`],
          extrapolate: 'clamp',
        });
        const fade = progress.interpolate({
          inputRange: [p0, pFade, p1],
          outputRange: [1, 1, 0],
          extrapolate: 'clamp',
        });

        return (
          <Animated.View
            key={`${burst}-${i}`}
            style={{
              position: 'absolute',
              left: piece.startX,
              top: 0,
              width: piece.width,
              height: piece.height,
              borderRadius: 2,
              backgroundColor: piece.color,
              opacity: fade,
              transform: [{ translateY: fall }, { translateX: sway }, { rotate: spin }],
            }}
          />
        );
      })}
      {message ? (
        <View
          style={{
            position: 'absolute',
            top: height * 0.3,
            left: 0,
            right: 0,
            alignItems: 'center',
          }}
        >
          <View
            style={{
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.gold,
              borderWidth: 2,
              borderRadius: theme.radius.lg,
              paddingHorizontal: theme.spacing.xl,
              paddingVertical: theme.spacing.lg,
              maxWidth: 320,
            }}
          >
            <AppText variant="title" semiBold center>
              {message}
            </AppText>
          </View>
        </View>
      ) : null}
    </View>
  );
}
