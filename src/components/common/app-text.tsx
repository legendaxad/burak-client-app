import { Text, type TextProps } from 'react-native';

import { useTheme, type ThemeColors, type TypographyName } from '@/theme';

type Tone = 'default' | 'muted' | 'primary' | 'danger' | 'success' | 'inverse' | 'onPrimary';

const toneToColor: Record<Tone, keyof ThemeColors> = {
  default: 'text',
  muted: 'textMuted',
  primary: 'primaryStrong',
  danger: 'danger',
  success: 'success',
  inverse: 'textInverse',
  onPrimary: 'onPrimary',
};

export interface AppTextProps extends TextProps {
  variant?: TypographyName;
  tone?: Tone;
  align?: 'left' | 'center' | 'right';
}

/** Typography primitive: every text in the app goes through the theme scale. */
export function AppText({ variant = 'body', tone = 'default', align, style, ...rest }: AppTextProps) {
  const theme = useTheme();
  return (
    <Text
      {...rest}
      style={[theme.typography[variant], { color: theme.colors[toneToColor[tone]] }, align && { textAlign: align }, style]}
    />
  );
}
