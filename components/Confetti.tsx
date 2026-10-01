import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
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

const SMALL_COUNT = 44;
const BIG_COUNT = 76;

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
 * Build a scattered burst: most pieces spawn top/center-ish, a quarter spray
 * from the sides, and every piece gets its own delay, duration, and path.
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

  return Array.from({ length: count }, () => {
    const sideSpray = rand() < 0.28;
    const originX = sideSpray
      ? rand() < 0.5
        ? between(rand, width * 0.02, width * 0.2)
        : between(rand, width * 0.8, width * 0.98)
      : width * (0.28 + centerBiased(rand) * 0.44);

    const originY = between(rand, height * 0.04, height * 0.26);
    const outward = originX < width / 2 ? -1 : 1;
    const spraySpan = sideSpray
      ? between(rand, width * 0.18, width * 0.46) * outward
      : between(rand, -width * 0.42, width * 0.42);
    const flutter = between(rand, -width * 0.08, width * 0.08);

    const ribbon = rand() < 0.22;
    const square = !ribbon && rand() < 0.18;
    const widthPx = ribbon
      ? between(rand, 4, 7)
      : square
        ? between(rand, 8, 13)
        : between(rand, 6, 12);
    const heightPx = ribbon ? between(rand, 14, 24) : square ? widthPx : between(rand, 9, 18);

    return {
      originX,
      originY,
      sprayX: spraySpan,
      midX: spraySpan * between(rand, 0.45, 0.75) + flutter,
      popY: between(rand, -height * 0.16, height * 0.06),
      fallY: height - originY + between(rand, 50, 160),
      delay: between(rand, 0, 420),
      duration: between(rand, 1500, 2500),
      rotateTo: between(rand, -900, 900),
      color: colors[Math.floor(rand() * colors.length)] ?? colors[0],
      width: widthPx,
      height: heightPx,
      borderRadius: square ? widthPx / 2 : between(rand, 1, 3.5),
    };
  });
}

const PieceView = memo(function PieceView({ piece }: { piece: ConfettiPiece }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    progress.setValue(0);
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: piece.duration,
      delay: piece.delay,
      easing: Easing.linear,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [piece, progress]);

  const translateY = progress.interpolate({
    inputRange: [0, 0.16, 1],
    outputRange: [0, piece.popY, piece.fallY],
  });
  const translateX = progress.interpolate({
    inputRange: [0, 0.2, 0.58, 1],
    outputRange: [0, piece.midX, piece.sprayX, piece.sprayX * 1.12],
  });
  const spin = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', `${piece.rotateTo}deg`],
  });
  const fade = progress.interpolate({
    inputRange: [0, 0.06, 0.8, 1],
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
 * A lightweight, dependency-free confetti burst: paper pieces explode from
 * the top/center with independent delay, duration, and spin, then the overlay
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
