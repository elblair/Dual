/**
 * The single source of truth for Dual's look: colors, fonts, type styles,
 * spacing, radii and sizes. Screens and components must never hardcode these.
 *
 * Only the light ("Base") theme exists today. To add Midnight dark mode later:
 * define `midnightColors` below (same keys as `lightColors`), add a `midnightTheme`,
 * and pick it in ThemeProvider with `useColorScheme()`. No component changes needed.
 *
 * Source: design/spec.md (Figma tokens + estimates read from the PNG exports).
 */

const lightColors = {
  // text
  ink: '#15151c',
  muted: '#6b6b78',
  mutedSoft: '#8a8a96',
  white: '#ffffff',
  // surfaces
  bg: '#ffffff',
  surface: '#f5f4f7',
  surfaceStrong: '#e8e7ec', // Break back button, soft buttons, big tab pills (estimate)
  border: '#e4e3e9',
  dotEmpty: '#e4e3e9',
  // brand
  maroon: '#6e1023', // brand: primary buttons, selected states
  maroonBright: '#a8203a', // opponent avatars / dots, destructive text
  maroonTint: '#f7eff1', // selected row background
  // "do this now"
  orange: '#f28c38',
  orangeDark: '#c4651a', // eyebrow labels
  orangeTint: '#fdeee3', // starter goal / recap / streak cards (estimate)
  // people
  blue: '#4a6286', // "you" avatar + dots, link text, Groups hero card
  blueTint: '#eaeef7', // highlighted leaderboard row (estimate)
  // status
  success: '#2e9e5b', // done check, leading score (estimate)
  successTint: '#e6f3ea', // (estimate)
  // overlays
  overlayLight: 'rgba(255,255,255,0.16)', // icon tiles on maroon, tracks on slate
} as const;

export type ColorName = keyof typeof lightColors;
export type Colors = Record<ColorName, string>;

const fonts = {
  regular: 'Inter_400Regular',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

const fontSizes = {
  eyebrow: 11,
  caption: 12,
  small: 13,
  subtitle: 14,
  body: 15,
  button: 16,
  subheading: 18,
  heading: 20,
  title: 28,
  display: 34,
  score: 44,
} as const;

export type TextVariant =
  | 'eyebrow'
  | 'display'
  | 'title'
  | 'heading'
  | 'subheading'
  | 'body'
  | 'bodyStrong'
  | 'label'
  | 'subtitle'
  | 'small'
  | 'smallStrong'
  | 'caption'
  | 'captionStrong'
  | 'button'
  | 'score';

export interface TextStyleToken {
  fontFamily: string;
  fontSize: number;
  letterSpacing?: number;
  textTransform?: 'uppercase';
}

const text: Record<TextVariant, TextStyleToken> = {
  eyebrow: { fontFamily: fonts.bold, fontSize: fontSizes.eyebrow, letterSpacing: 0.66, textTransform: 'uppercase' },
  display: { fontFamily: fonts.bold, fontSize: fontSizes.display },
  title: { fontFamily: fonts.bold, fontSize: fontSizes.title },
  heading: { fontFamily: fonts.bold, fontSize: fontSizes.heading },
  subheading: { fontFamily: fonts.semibold, fontSize: fontSizes.subheading },
  body: { fontFamily: fonts.regular, fontSize: fontSizes.body },
  bodyStrong: { fontFamily: fonts.semibold, fontSize: fontSizes.body },
  label: { fontFamily: fonts.semibold, fontSize: fontSizes.subtitle },
  subtitle: { fontFamily: fonts.regular, fontSize: fontSizes.subtitle },
  small: { fontFamily: fonts.regular, fontSize: fontSizes.small },
  smallStrong: { fontFamily: fonts.semibold, fontSize: fontSizes.small },
  caption: { fontFamily: fonts.regular, fontSize: fontSizes.caption },
  captionStrong: { fontFamily: fonts.semibold, fontSize: fontSizes.caption },
  button: { fontFamily: fonts.semibold, fontSize: fontSizes.button },
  score: { fontFamily: fonts.bold, fontSize: fontSizes.score },
};

const spacing = {
  hairline: 2,
  xs: 4,
  sm: 8,
  md: 10,
  lg: 12,
  xl: 14,
  xxl: 16,
  xxxl: 20,
  gutter: 22, // screen side padding
  screenTopExtra: 12, // added to the safe-area top inset (about 60pt on a notched iPhone)
  screenBottomMin: 30, // minimum bottom padding
  section: 28,
} as const;

const radii = {
  xs: 2,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 28,
  pill: 999,
} as const;

const borders = {
  hairline: 1,
  thick: 1.5,
  selected: 2,
  ring: 3,
} as const;

const sizes = {
  avatar: { xs: 24, sm: 32, md: 40, lg: 64, xl: 72 },
  dot: { md: 14, lg: 18 },
  dotGap: { md: 6, lg: 6 },
  backButton: 40,
  radio: 22,
  iconSm: 14,
  icon: 18,
  iconLg: 22,
  tabIcon: 24,
  plusButton: 52,
  iconTile: 44,
  logo: {
    sm: { barWidth: 4, barHeight: 14, gap: 2, font: 14 },
    lg: { barWidth: 8, barHeight: 22, gap: 3, font: 26 },
  },
} as const;

export interface Theme {
  name: 'light' | 'dark';
  colors: Colors;
  fonts: typeof fonts;
  fontSizes: typeof fontSizes;
  text: Record<TextVariant, TextStyleToken>;
  spacing: typeof spacing;
  radii: typeof radii;
  borders: typeof borders;
  sizes: typeof sizes;
}

const shared = { fonts, fontSizes, text, spacing, radii, borders, sizes };

export const lightTheme: Theme = {
  name: 'light',
  colors: lightColors,
  ...shared,
};

// export const midnightTheme: Theme = { name: 'dark', colors: midnightColors, ...shared };
