import React from 'react';
import { View } from 'react-native';

import { useTheme } from '@/lib/theme-context';

interface ProgressBarProps {
  /** 0–100 */
  percent: number;
  color?: string;
  height?: number;
}

/** Rounded progress bar used for "X% of the Bible completed". */
export function ProgressBar({ percent, color, height = 10 }: ProgressBarProps) {
  const theme = useTheme();
  const clamped = Math.min(100, Math.max(0, percent));

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: clamped }}
      style={{
        height,
        borderRadius: height / 2,
        backgroundColor: theme.colors.surfaceAlt,
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          width: `${clamped}%`,
          height: '100%',
          borderRadius: height / 2,
          backgroundColor: color ?? theme.colors.green,
        }}
      />
    </View>
  );
}
