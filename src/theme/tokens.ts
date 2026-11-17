import type { TextStyle } from 'react-native';

/** Raw BURAK brand palette (from the Admin app identity). Components use semantic colors, not these. */
export const palette = {
  ink: '#171615',
  charcoal: '#343230',
  gold: '#D7B77E',
  goldDeep: '#B78C4D',
  cream: '#F8F8FC',
  white: '#FFFFFF',
  warm: '#F1EDE6',
  sand: '#F5EBD9',
  stone: '#E6E0D6',
  text: '#292724',
  muted: '#817D76',
  line: '#E8E5DF',
  green: '#3D7955',
  greenPale: '#E7F1E8',
  red: '#A95142',
  redPale: '#F5E5E2',
  blue: '#407DAB',
  bluePale: '#E9F0F5',
} as const;

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
} as const;

type TypographyVariant =
  | 'display'
  | 'title'
  | 'heading'
  | 'subheading'
  | 'body'
  | 'bodyStrong'
  | 'caption'
  | 'overline'
  | 'button';

export const typography: Record<TypographyVariant, TextStyle> = {
  display: { fontSize: 31, lineHeight: 37, fontWeight: '800', letterSpacing: -0.6 },
  title: { fontSize: 26, lineHeight: 32, fontWeight: '800', letterSpacing: -0.5 },
  heading: { fontSize: 19, lineHeight: 25, fontWeight: '800', letterSpacing: -0.25 },
  subheading: { fontSize: 16, lineHeight: 22, fontWeight: '700' },
  body: { fontSize: 14, lineHeight: 21, fontWeight: '400' },
  bodyStrong: { fontSize: 14, lineHeight: 20, fontWeight: '700' },
  caption: { fontSize: 12, lineHeight: 17, fontWeight: '500' },
  overline: { fontSize: 10, lineHeight: 14, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase' },
  button: { fontSize: 14, lineHeight: 18, fontWeight: '800' },
};

/** Minimum sizes. 44/48 pt follow the iOS HIG and Material touch-target guidance. */
export const sizes = {
  touchTarget: 44,
  buttonHeight: 50,
  inputHeight: 50,
  chipHeight: 38,
  iconSm: 16,
  iconMd: 20,
  iconLg: 24,
  avatar: 44,
  contentMaxWidth: 760,
} as const;

export type TypographyName = keyof typeof typography;
