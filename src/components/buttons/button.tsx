import { ActivityIndicator, Pressable, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { Icon, type IconName } from '@/components/common/icon';
import { makeStyles, useTheme } from '@/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  loading = false,
  disabled = false,
  fullWidth = false,
  accessibilityHint,
  style,
  testID,
}: ButtonProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  const inactive = disabled || loading;
  const foreground =
    variant === 'primary' ? colors.onPrimary : variant === 'danger' ? colors.danger : colors.text;

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        fullWidth && styles.fullWidth,
        inactive && styles.inactive,
        pressed && !inactive && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={foreground} size="small" />
      ) : icon ? (
        <Icon name={icon} size={17} color={foreground} />
      ) : null}
      <View>
        <AppText variant="button" style={{ color: foreground }}>
          {title}
        </AppText>
      </View>
    </Pressable>
  );
}

const useStyles = makeStyles((t) => ({
  base: {
    minHeight: t.sizes.buttonHeight,
    borderRadius: t.radius.md,
    paddingHorizontal: t.spacing.lg + 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: t.spacing.sm,
  },
  primary: { backgroundColor: t.colors.primary },
  secondary: { backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.border },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: t.colors.dangerSoft },
  fullWidth: { alignSelf: 'stretch' },
  inactive: { opacity: 0.5 },
  pressed: { opacity: 0.75 },
}));
