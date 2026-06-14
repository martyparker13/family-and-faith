/**
 * Spacing & shape tokens. Touch targets are kept large (minTouch = 48)
 * so small fingers can hit them on a shared tablet.
 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  pill: 999,
} as const;

/** Minimum touch target size (a11y) */
export const minTouch = 48;
