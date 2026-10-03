import React, { memo, useEffect, useMemo, useState } from 'react';
import { Animated, Easing, StyleSheet, useWindowDimensions, View } from 'react-native';

import { AppText } from './AppText';
import { useTheme } from '@/lib/theme-context';

interface ConfettiProps {
  /** Increment to fire a new burst; 0 renders nothing. */
  burst: number;
  /** Optional celebration message shown in the middle of the burst. */
  message?: string | null;
  /** "big" uses more pieces for milestone moments. */
  size?: 'small' | 'big';
}

export interface ConfettiPiece {
  originX: number;
  originY: number;
  sprayX: number;
  midX: number;
  popY: number;
  fallY: number;
  delay: number;
  duration: number;
  rotateTo: number;
  color: string;
  width: number;
  height: number;
  borderRadius: number;
}

const SMALL_COUNT = 48;
const BIG_COUNT = 68;

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

function between(rand: () => number, min: number, max: number): number {
  return min + rand() * (max - min);
}

/** Average of three samples — peaked near 0.5 so most pieces spawn mid-screen. */
function centerBiased(rand: () => number): number {
  return (rand() + rand() + rand()) / 3;
}

/**
 * Pure Y motion matching PieceView's translateY interpolate
 * inputRange [0, 0.18, 1] → [0, popY, fallY].
 */
export function confettiTranslateYAt(piece: ConfettiPiece, progress: number): number {
  const p = Math.max(0, Math.min(1, progress));
  if (p <= 0.18) return (p / 0.18) * piece.popY;
  return piece.popY + ((p - 0.18) / 0.82) * (piece.fallY - piece.popY);
}

/** Absolute screen Y for a piece at wall-clock time (ms since burst start). */
export function confettiAbsoluteYAt(piece: ConfettiPiece, timeMs: number): number {
  if (timeMs <= piece.delay) return piece.originY;
  const progress = Math.min(1, (timeMs - piece.delay) / piece.duration);
  return piece.originY + confettiTranslateYAt(piece, progress);
}

/**
 * Build a scattered burst: pieces seed across the upper half with wide delay
 * and speed variance so any snapshot shows different Y positions — not one row.
 */
export function buildConfettiPieces(
  burst: number,
  size: 'small' | 'big',
  width: number,
  height: number,
  colors: string[]
): ConfettiPiece[] {
  if (burst === 0 || width <= 0 || height <= 0 || colors.length === 0) return [];

  const rand = mulberry32(burst * 9301 + 49297);
  const count = size === 'big' ? BIG_COUNT : SMALL_COUNT;

  return Array.from({ length: count }, (_, index) => {
    const sideSpray = rand() < 0.3;
    const originX = sideSpray
      ? rand() < 0.5
        ? between(rand, width * 0.01, width * 0.22)
        : between(rand, width * 0.78, width * 0.99)
      : width * (0.12 + centerBiased(rand) * 0.76);

    // Spread across the full upper half so the first frame is already a cloud,
    // not a thin horizontal line near the top.
    const originY = between(rand, height * 0.02, height * 0.5);

    const outward = originX < width / 2 ? -1 : 1;
    const spraySpan = sideSpray
      ? between(rand, width * 0.2, width * 0.55) * outward
      : between(rand, -width * 0.55, width * 0.55);
    const flutter = between(rand, -width * 0.14, width * 0.14);

    const ribbon = rand() < 0.22;
    const square = !ribbon && rand() < 0.18;
    const widthPx = ribbon
      ? between(rand, 4, 7)
      : square
        ? between(rand, 8, 13)
        : between(rand, 6, 12);
    const heightPx = ribbon ? between(rand, 14, 24) : square ? widthPx : between(rand, 9, 18);

    // Stagger starts across most of the fall window so early and late pieces
    // coexist on screen at very different Y positions.
    const wave = (index / count) * 900;
    const delay = wave + between(rand, 0, 700);

    return {
      originX,
      originY,
      sprayX: spraySpan,
      midX: spraySpan * between(rand, 0.35, 0.7) + flutter,
      popY: between(rand, -height * 0.22, height * 0.1),
      fallY: height - originY + between(rand, 40, 220),
      delay,
      duration: between(rand, 1100, 2800),
      rotateTo: between(rand, -1080, 1080),
      color: colors[Math.floor(rand() * colors.length)] ?? colors[0],
      width: widthPx,
      height: heightPx,
      borderRadius: square ? widthPx / 2 : between(rand, 1, 3.5),
    };
  });
}

const PieceView = memo(function PieceView({ piece }: { piece: ConfettiPiece }) {
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    progress.setValue(0);
    // Sequence keeps delay off the native timing node (more reliable than
    // Animated.timing({ delay }) alone) while still using the native driver.
    const animation = Animated.sequence([
      Animated.delay(piece.delay),
      Animated.timing(progress, {
        toValue: 1,
        duration: piece.duration,
        easing: Easing.bezier(0.22, 0.61, 0.36, 1),
        useNativeDriver: true,
      }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [piece, progress]);

  const translateY = progress.interpolate({
    inputRange: [0, 0.18, 1],
    outputRange: [0, piece.popY, piece.fallY],
  });
  const translateX = progress.interpolate({
    inputRange: [0, 0.22, 0.55, 1],
    outputRange: [0, piece.midX, piece.sprayX, piece.sprayX * 1.15],
  });
  const spin = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', `${piece.rotateTo}deg`],
  });
  const fade = progress.interpolate({
    inputRange: [0, 0.04, 0.78, 1],
    outputRange: [0, 1, 1, 0],
  });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: piece.originX,
        top: piece.originY,
        width: piece.width,
        height: piece.height,
        borderRadius: piece.borderRadius,
        backgroundColor: piece.color,
        opacity: fade,
        transform: [{ translateX }, { translateY }, { rotate: spin }],
      }}
    />
  );
});

/**
 * A lightweight, dependency-free confetti burst: paper pieces explode across
 * the upper half with independent delay, duration, and spin, then the overlay
 * removes itself. Purely decorative — hidden from screen readers.
 */
export function Confetti({ burst, message, size = 'small' }: ConfettiProps) {
  const theme = useTheme();
  const { width, height } = useWindowDimensions();
  // The burst whose animation has finished — hides the overlay again.
  const [finishedBurst, setFinishedBurst] = useState(0);

  const colors = useMemo(
    () => [
      theme.colors.gold,
      theme.colors.goldDeep,
      theme.colors.blue,
      theme.colors.green,
      theme.colors.surface,
      theme.colors.background,
      theme.colors.surfaceAlt,
    ],
    [theme]
  );

  const pieces = useMemo(
    () => buildConfettiPieces(burst, size, width, height, colors),
    [burst, size, width, height, colors]
  );

  useEffect(() => {
    if (burst === 0 || pieces.length === 0) return;
    const longest = Math.max(...pieces.map((piece) => piece.delay + piece.duration));
    const hide = setTimeout(() => setFinishedBurst(burst), longest);
    return () => clearTimeout(hide);
  }, [burst, pieces]);

  if (burst === 0 || burst === finishedBurst || pieces.length === 0) return null;

  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={StyleSheet.absoluteFill}
    >
      {pieces.map((piece, i) => (
        <PieceView key={`${burst}-${i}`} piece={piece} />
      ))}
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
