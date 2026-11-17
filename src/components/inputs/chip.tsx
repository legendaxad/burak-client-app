import { Pressable } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { Icon, type IconName } from '@/components/common/icon';
import { makeStyles, useTheme } from '@/theme';

interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: IconName;
}

export function Chip({ label, selected, onPress, icon }: ChipProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  const color = selected ? colors.onSelected : colors.textMuted;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      hitSlop={{ top: 4, bottom: 4 }}
      style={({ pressed }) => [styles.chip, selected && styles.selected, pressed && styles.pressed]}
    >
      {icon ? <Icon name={icon} size={15} color={color} /> : null}
      <AppText variant="caption" style={[styles.label, { color }]}>
        {label}
      </AppText>
    </Pressable>
  );
}

const useStyles = makeStyles((t) => ({
  chip: {
    minHeight: t.sizes.chipHeight,
    paddingHorizontal: t.spacing.md + 2,
    borderRadius: t.radius.pill,
    backgroundColor: t.colors.surface,
    borderColor: t.colors.border,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.xs + 2,
  },
  selected: { backgroundColor: t.colors.selected, borderColor: t.colors.selected },
  label: { fontWeight: '700' },
  pressed: { opacity: 0.8 },
}));
