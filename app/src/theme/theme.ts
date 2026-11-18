/**
 * The single source of truth for Dual's look: colors, fonts, type styles,
 * spacing, radii and sizes. Screens and components must never hardcode these.
 *
 * Two themes: light ("Base") and dark ("Midnight"). Both palettes have the same keys; ThemeProvider picks one from the
 * device setting (`useColorScheme()`) or from the person's choice on You (System / Light / Dark).
 * Midnight values are the fills used on the Figma "Style 1 · Midnight" Home frame (213:228); `maroonTint`, `blueTint`
 * and `success` are not on that frame and are derived (see docs/FEATURES.md).
 *
 * Every value is read from the Figma file (fwmURCNVOUlAAJfknpGhDS, page "Dual v2 · Improved",
 * row "Claude's Pick" + Break from the Base row). See design/spec.md.
 */

const lightColors = {
  // text
  ink: '#15151c',
  muted: '#6b6b78',
  mutedSoft: '#8a8a96',
  white: '#ffffff',
  onOrange: '#15151c', // text on orange buttons (dark in both themes)
  link: '#4a6286', // link text (lighter blue in dark)
  tabActive: '#6e1023', // selected tab
  // surfaces
  bg: '#ffffff',
  card: '#ffffff', // cards and the tab bar (raised above the page in dark)
  cardRaised: '#ffffff', // a card sitting on a `surface` background (Accept)
  surface: '#f5f4f7',
  surfaceStrong: '#eae9ee', // pills, icon circles, "See how it ends" button
  border: '#e4e3e9',
  dotEmpty: '#e4e3e9',
  // brand
  maroon: '#6e1023', // primary buttons, selected states
  maroonBright: '#a8203a', // opponent avatars / dots, destructive text
  maroonTint: '#f7eff1', // selected row background
  // "do this now"
  orange: '#f28c38',
  orangeDark: '#c4651a', // eyebrow labels
  orangeTint: '#fdf1e7', // starter goal / recap / streak cards
  // people
  blue: '#4a6286', // "you" avatar + dots, link text, Groups hero card
  blueTint: '#edf1f7', // highlighted leaderboard row
  // status
  success: '#2e9e5b',
  successTint: '#e6f4ec',
  // translucent whites on maroon / slate cards
  overlayLight: 'rgba(255,255,255,0.16)', // icon tile, camera button
  overlayTrack: 'rgba(255,255,255,0.2)', // progress track
  onDarkMuted: 'rgba(255,255,255,0.8)', // secondary text on maroon / slate
  onDarkSubtle: 'rgba(255,255,255,0.85)', // footnote on slate
} as const;

export type ColorName = keyof typeof lightColors;
export type Colors = Record<ColorName, string>;

const midnightColors: Colors = {
  ink: '#f2f2f5',
  muted: '#9b9ba8',
  mutedSoft: '#8a8a96',
  white: '#ffffff',
  onOrange: '#15151c',
  link: '#9db4d6',
  tabActive: '#f2f2f5',
  bg: '#0b0b10',
  card: '#17171f',
  cardRaised: '#23232e',
  surface: '#17171f',
  surfaceStrong: '#23232e',
  border: '#2a2a35',
  dotEmpty: '#2a2a35',
  maroon: '#8e1730',
  maroonBright: '#a8203a',
  maroonTint: '#2a1219',
  orange: '#f28c38',
  orangeDark: '#f28c38',
  orangeTint: '#2a1e16',
  blue: '#4a6286',
  blueTint: '#1b2433',
  success: '#3dab6c',
  successTint: '#14291d',
  overlayLight: 'rgba(255,255,255,0.16)',
  overlayTrack: 'rgba(255,255,255,0.2)',
  onDarkMuted: 'rgba(255,255,255,0.8)',
  onDarkSubtle: 'rgba(255,255,255,0.85)',
};

const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

const fontSizes = {
  tiny: 10,
  micro: 11,
  caption: 12,
  small: 13,
  subtitle: 14,
  body: 15,
  button: 16,
  headingSm: 17,
  subheading: 18,
  heading: 20,
  headingLg: 22,
  title: 28,
  titleLg: 30,
  display: 32,
  score: 48,
} as const;

export type TextVariant =
  | 'eyebrow'
  | 'score'
  | 'display'
  | 'titleLg'
  | 'title'
  | 'headingLg'
  | 'heading'
  | 'headingSm'
  | 'headerTitle'
  | 'subheading'
  | 'cardTitle'
  | 'body'
  | 'bodyStrong'
  | 'label'
  | 'labelMedium'
  | 'subtitle'
  | 'small'
  | 'smallMedium'
  | 'smallStrong'
  | 'caption'
  | 'captionStrong'
  | 'micro'
  | 'microMedium'
  | 'microStrong'
  | 'tiny'
  | 'button';

export interface TextStyleToken {
  fontFamily: string;
  fontSize: number;
  letterSpacing?: number;
  textTransform?: 'uppercase';
}

const text: Record<TextVariant, TextStyleToken> = {
  eyebrow: { fontFamily: fonts.bold, fontSize: fontSizes.micro, letterSpacing: 0.66, textTransform: 'uppercase' },
  score: { fontFamily: fonts.bold, fontSize: fontSizes.score },
  display: { fontFamily: fonts.bold, fontSize: fontSizes.display },
  titleLg: { fontFamily: fonts.bold, fontSize: fontSizes.titleLg },
  title: { fontFamily: fonts.bold, fontSize: fontSizes.title },
  headingLg: { fontFamily: fonts.bold, fontSize: fontSizes.headingLg },
  heading: { fontFamily: fonts.bold, fontSize: fontSizes.heading },
  headingSm: { fontFamily: fonts.bold, fontSize: fontSizes.headingSm },
  headerTitle: { fontFamily: fonts.semibold, fontSize: fontSizes.headingSm },
  subheading: { fontFamily: fonts.semibold, fontSize: fontSizes.subheading },
  cardTitle: { fontFamily: fonts.bold, fontSize: fontSizes.button },
  body: { fontFamily: fonts.regular, fontSize: fontSizes.body },
  bodyStrong: { fontFamily: fonts.semibold, fontSize: fontSizes.body },
  label: { fontFamily: fonts.semibold, fontSize: fontSizes.subtitle },
  labelMedium: { fontFamily: fonts.medium, fontSize: fontSizes.subtitle },
  subtitle: { fontFamily: fonts.regular, fontSize: fontSizes.subtitle },
  small: { fontFamily: fonts.regular, fontSize: fontSizes.small },
  smallMedium: { fontFamily: fonts.medium, fontSize: fontSizes.small },
  smallStrong: { fontFamily: fonts.semibold, fontSize: fontSizes.small },
  caption: { fontFamily: fonts.regular, fontSize: fontSizes.caption },
  captionStrong: { fontFamily: fonts.semibold, fontSize: fontSizes.caption },
  micro: { fontFamily: fonts.regular, fontSize: fontSizes.micro },
  microMedium: { fontFamily: fonts.medium, fontSize: fontSizes.micro },
  microStrong: { fontFamily: fonts.semibold, fontSize: fontSizes.micro },
  tiny: { fontFamily: fonts.regular, fontSize: fontSizes.tiny },
  button: { fontFamily: fonts.semibold, fontSize: fontSizes.button },
};

/** Raw Figma values, named by number when there is no better meaning (s6 = 6pt). */
const spacing = {
  hairline: 2,
  s3: 3,
  xs: 4,
  s6: 6,
  sm: 8,
  s9: 9,
  md: 10,
  lg: 12,
  s13: 13,
  xl: 14,
  s15: 15,
  xxl: 16,
  s18: 18,
  xxxl: 20,
  gutter: 22, // screen side padding
  section: 28,
  tabBottom: 28, // tab bar bottom padding (minimum)
  screenGap: 14, // gap between blocks (Friend, Accept, Done, Result, Save)
  screenGapLoose: 16, // gap between blocks (Hobby, Today, Duel, Groups, You)
  screenTop: 60, // minimum top padding (Figma: 60 from the screen edge, status bar included)
  screenTopExtra: 12, // added to the safe-area top inset when that is larger than screenTop
  breakTop: 56, // Break screen (Base row) top padding
  screenBottomMin: 30, // minimum bottom padding
} as const;

const radii = {
  xs: 2,
  bar: 4, // large logo bars
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  hero: 22, // Today hero card, Groups hero card
  score: 24, // Duel score card
  pill: 999,
} as const;

const borders = {
  hairline: 1,
  thick: 1.5, // selected cards, radio outline
  selected: 2, // "today" dot ring
  ring: 3, // avatar ring
} as const;

const sizes = {
  avatar: { xxs: 24, xs: 26, sm: 32, md: 40, header: 42, crew: 50, lg: 56, xl: 64, xxl: 72, hero: 92 },
  dot: { md: 14, lg: 18 },
  dotGap: 6,
  backButton: 40,
  radio: 22,
  icon: { badge: 13, xs: 14, copy: 15, sm: 16, md: 18, back: 19, lg: 20, xl: 22, plus: 26, flame: 30, hero: 52 },
  weekDay: 34, // streak card day bubble
  rankBar: 8, // XP progress bar height (radius 4)
  perkBadge: 28, // check / lock circle on the rank card
  playerName: 62, // name label next to dots
  barLabel: 64, // label next to a progress bar (Groups)
  bar: 10, // progress bar height (radius 5)
  plusButton: 52,
  iconTile: 44,
  cameraButton: 54,
  successBadge: 104,
  flameTile: 64,
  strengthBar: 6, // password strength segments (Auth)
  codeBox: { width: 46, height: 56 }, // one digit of the email code (Verify)
  checkBadge: 72, // "Verified" check (Verify)
  logo: {
    sm: { barWidth: 4, barHeight: 14, barGap: 2, textGap: 4, font: 14 },
    lg: { barWidth: 7, barHeight: 22, barGap: 3, textGap: 7, font: 22 },
  },
} as const;

/** Animation timing (ms) and distances (pt). Not in Figma: kept short so the app never feels slow. */
const motion = {
  fast: 150,
  base: 250,
  slow: 400,
  stagger: 70, // delay between items that fade in one after another
  celebrate: 650, // how long the "Verified" check shows before moving on
  enterDistance: 12, // content slides up this far as it fades in
  shakeDistance: 8, // wrong-code shake
  popScale: 0.6, // the check badge grows from this scale
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
  motion: typeof motion;
}

const shared = { fonts, fontSizes, text, spacing, radii, borders, sizes, motion };

export const lightTheme: Theme = {
  name: 'light',
  colors: lightColors,
  ...shared,
};

export const midnightTheme: Theme = {
  name: 'dark',
  colors: midnightColors,
  ...shared,
};
