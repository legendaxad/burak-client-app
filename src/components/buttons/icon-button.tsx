import { Pressable, type StyleProp, type ViewStyle } from 'react-native';

import { Icon, type IconName } from '@/components/common/icon';
import { makeStyles, useTheme } from '@/theme';

interface IconButtonProps {
  icon: IconName;
  accessibilityLabel: string;
  onPress: () => void;
  tone?: 'surface' | 'overlay';
  style?: StyleProp<ViewStyle>;
}

/** Round 44 pt button for header actions (back, close…). */
export function IconButton({ icon, accessibilityLabel, onPress, tone = 'surface', style }: IconButtonProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => [styles.base, tone === 'overlay' && styles.overlay, pressed && styles.pressed, style]}
    >
      <Icon name={icon} size={20} color={tone === 'overlay' ? '#171615' : colors.text} />
    </Pressable>
  );
}

const useStyles = makeStyles((t) => ({
  base: {
    width: t.sizes.touchTarget,
    height: t.sizes.touchTarget,
    borderRadius: t.sizes.touchTarget / 2,
    backgroundColor: t.colors.surface,
    borderWidth: 1,
    borderColor: t.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: { backgroundColor: 'rgba(255,255,255,0.92)', borderColor: 'transparent', ...t.shadows.card },
  pressed: { opacity: 0.7 },
}));
