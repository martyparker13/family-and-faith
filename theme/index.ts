import { darkPalette, lightPalette, type Palette } from './colors';
import { fonts, fontSizes, lineHeights } from './typography';
import { minTouch, radius, spacing } from './spacing';

export interface Theme {
  scheme: 'light' | 'dark';
  colors: Palette;
  fonts: typeof fonts;
  fontSizes: typeof fontSizes;
  lineHeights: typeof lineHeights;
  spacing: typeof spacing;
  radius: typeof radius;
  minTouch: number;
}

export const lightTheme: Theme = {
  scheme: 'light',
  colors: lightPalette,
  fonts,
  fontSizes,
  lineHeights,
  spacing,
  radius,
  minTouch,
};

export const darkTheme: Theme = {
  ...lightTheme,
  scheme: 'dark',
  colors: darkPalette,
};

export { fonts, fontSizes, lineHeights, radius, spacing, minTouch };
export type { Palette };
