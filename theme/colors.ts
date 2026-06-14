/**
 * Color palettes for Family & Faith.
 *
 * The palette is intentionally warm and book-like: soft creams, warm golds,
 * and gentle blues/greens. Dark mode keeps the same warmth (candle-lit browns)
 * rather than switching to a cold slate gray.
 */
export interface Palette {
  /** Screen background */
  background: string;
  /** Card / sheet surfaces */
  surface: string;
  /** Slightly raised surface (e.g. nested cards, inputs) */
  surfaceAlt: string;
  /** Primary body text */
  text: string;
  /** Secondary / caption text */
  textMuted: string;
  /** Warm gold — primary actions, highlights, streak flame */
  gold: string;
  /** Deeper gold for pressed states and text on cream */
  goldDeep: string;
  /** Gentle blue — readings */
  blue: string;
  /** Soft green — growth, prayers, completed states */
  green: string;
  /** Soft terracotta — devotionals, hearts */
  clay: string;
  /** Hairline borders */
  border: string;
  /** Text rendered on top of gold/blue/green fills */
  onAccent: string;
  /** Success (answered prayers, completed days) */
  success: string;
  /** Danger (delete actions) */
  danger: string;
  /** Translucent overlay scrim */
  scrim: string;
}

export const lightPalette: Palette = {
  background: '#FBF5E9',
  surface: '#FFFDF7',
  surfaceAlt: '#F4ECDA',
  text: '#3D3225',
  textMuted: '#85765F',
  gold: '#C9973B',
  goldDeep: '#A47A2A',
  blue: '#5E87A8',
  green: '#6F9E78',
  clay: '#C0795B',
  border: '#E9DEC6',
  onAccent: '#FFFDF7',
  success: '#5C8A66',
  danger: '#B5564B',
  scrim: 'rgba(61, 50, 37, 0.5)',
};

export const darkPalette: Palette = {
  background: '#211B12',
  surface: '#2B2418',
  surfaceAlt: '#372E1F',
  text: '#F2E8D5',
  textMuted: '#B4A689',
  gold: '#E0B45C',
  goldDeep: '#C9973B',
  blue: '#8FB3D2',
  green: '#93BE9C',
  clay: '#D6987C',
  border: '#423826',
  onAccent: '#211B12',
  success: '#93BE9C',
  danger: '#D98C82',
  scrim: 'rgba(0, 0, 0, 0.6)',
};
