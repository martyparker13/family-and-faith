/**
 * Typography scale.
 *
 * Two families, loaded in app/_layout.tsx via expo-font:
 *  - Lora (friendly serif)  → scripture text, big display headings
 *  - Nunito (rounded sans)  → UI, body copy, buttons
 *
 * Sizes are generous on purpose — kids often read along on a parent's phone.
 * Scripture/body text additionally multiplies by the user's text-size setting
 * (see store/settings.ts).
 */
export const fonts = {
  serif: 'Lora_500Medium',
  serifBold: 'Lora_600SemiBold',
  serifItalic: 'Lora_500Medium_Italic',
  sans: 'Nunito_400Regular',
  sansSemiBold: 'Nunito_600SemiBold',
  sansBold: 'Nunito_700Bold',
  sansExtraBold: 'Nunito_800ExtraBold',
} as const;

export const fontSizes = {
  caption: 13,
  small: 15,
  body: 17,
  bodyLarge: 19,
  scripture: 20,
  title: 22,
  heading: 26,
  display: 32,
} as const;

export const lineHeights = {
  caption: 18,
  small: 21,
  body: 26,
  bodyLarge: 29,
  scripture: 32,
  title: 30,
  heading: 34,
  display: 40,
} as const;

export type FontSizeKey = keyof typeof fontSizes;
