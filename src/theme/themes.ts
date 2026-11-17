import type { ViewStyle } from 'react-native';

import { palette, radius, sizes, spacing, typography } from './tokens';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  text: string;
  textMuted: string;
  textInverse: string;
  primary: string;
  primaryStrong: string;
  onPrimary: string;
  accentSoft: string;
  selected: string;
  onSelected: string;
  placeholder: string;
  success: string;
  successSoft: string;
  danger: string;
  dangerSoft: string;
  info: string;
  infoSoft: string;
  heroBackground: string;
  heroText: string;
  heroTextMuted: string;
  scrim: string;
  inputPlaceholder: string;
}

export interface Theme {
  scheme: 'light' | 'dark';
  colors: ThemeColors;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  sizes: typeof sizes;
  shadows: { card: ViewStyle; raised: ViewStyle };
}

const lightColors: ThemeColors = {
  background: palette.cream,
  surface: palette.white,
  surfaceMuted: palette.warm,
  border: palette.line,
  text: palette.text,
  textMuted: palette.muted,
  textInverse: palette.white,
  primary: palette.gold,
  primaryStrong: palette.goldDeep,
  onPrimary: palette.ink,
  accentSoft: palette.sand,
  selected: palette.ink,
  onSelected: palette.gold,
  placeholder: palette.stone,
  success: palette.green,
  successSoft: palette.greenPale,
  danger: palette.red,
  dangerSoft: palette.redPale,
  info: palette.blue,
  infoSoft: palette.bluePale,
  heroBackground: palette.ink,
  heroText: palette.white,
  heroTextMuted: '#E9E2D8',
  scrim: 'rgba(15,14,13,0.56)',
  inputPlaceholder: '#A6A198',
};

const darkColors: ThemeColors = {
  background: '#121110',
  surface: '#1C1A18',
  surfaceMuted: '#26231F',
  border: '#332F2A',
  text: '#F3EFE8',
  textMuted: '#A9A297',
  textInverse: palette.ink,
  primary: palette.gold,
  primaryStrong: palette.gold,
  onPrimary: palette.ink,
  accentSoft: '#3A3123',
  selected: palette.gold,
  onSelected: palette.ink,
  placeholder: '#2C2925',
  success: '#7DBA92',
  successSoft: '#1E2C22',
  danger: '#E08F80',
  dangerSoft: '#3A221E',
  info: '#86B6DA',
  infoSoft: '#1C2731',
  heroBackground: '#0B0A09',
  heroText: palette.white,
  heroTextMuted: '#E9E2D8',
  scrim: 'rgba(8,7,6,0.62)',
  inputPlaceholder: '#7D776E',
};

function buildTheme(scheme: Theme['scheme'], colors: ThemeColors): Theme {
  return {
    scheme,
    colors,
    spacing,
    radius,
    typography,
    sizes,
    shadows: {
      card: {
        shadowColor: '#1B1916',
        shadowOpacity: scheme === 'light' ? 0.06 : 0,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: scheme === 'light' ? 2 : 0,
      },
      raised: {
        shadowColor: '#000',
        shadowOpacity: 0.16,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        elevation: 6,
      },
    },
  };
}

export const lightTheme = buildTheme('light', lightColors);
export const darkTheme = buildTheme('dark', darkColors);
