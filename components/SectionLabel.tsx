import React from 'react';

import { AppText } from './AppText';
import { useTheme } from '@/lib/theme-context';

/** Small uppercase section heading used across screens. */
export function SectionLabel({ children, color }: { children: string; color?: string }) {
  const theme = useTheme();
  return (
    <AppText
      variant="caption"
      bold
      scaled={false}
      color={color ?? theme.colors.textMuted}
      style={{
        textTransform: 'uppercase',
        letterSpacing: 1.2,
        marginBottom: theme.spacing.sm,
        marginTop: theme.spacing.xl,
      }}
      accessibilityRole="header"
    >
      {children}
    </AppText>
  );
}
