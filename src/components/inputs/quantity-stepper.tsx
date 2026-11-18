import { Pressable, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { Icon } from '@/components/common/icon';
import { makeStyles, useTheme } from '@/theme';

interface QuantityStepperProps {
  value: number;
  min?: number;
  max: number;
  onChange: (value: number) => void;
  /** Used in accessibility labels, e.g. the product name. */
  label: string;
  disabled?: boolean;
  compact?: boolean;
}

export function QuantityStepper({ value, min = 1, max, onChange, label, disabled = false, compact = false }: QuantityStepperProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  const canDecrease = !disabled && value > min;
  const canIncrease = !disabled && value < max;

  return (
    <View
      style={[styles.root, compact && styles.compact]}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={`${label} quantity`}
      accessibilityValue={{ min, max, now: value }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(event) => {
        if (event.nativeEvent.actionName === 'increment' && canIncrease) onChange(value + 1);
        if (event.nativeEvent.actionName === 'decrement' && canDecrease) onChange(value - 1);
      }}
    >
      <Pressable
        accessibilityLabel={`Decrease ${label}`}
        disabled={!canDecrease}
        onPress={() => onChange(value - 1)}
        hitSlop={6}
        style={({ pressed }) => [styles.button, !canDecrease && styles.disabled, pressed && styles.pressed]}
      >
        <Icon name="minus" size={16} color={colors.text} />
      </Pressable>
      <AppText variant="bodyStrong" style={styles.value}>
        {value}
      </AppText>
      <Pressable
        accessibilityLabel={`Increase ${label}`}
        disabled={!canIncrease}
        onPress={() => onChange(value + 1)}
        hitSlop={6}
        style={({ pressed }) => [styles.button, !canIncrease && styles.disabled, pressed && styles.pressed]}
      >
        <Icon name="plus" size={16} color={colors.text} />
      </Pressable>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  root: {
    height: t.sizes.touchTarget,
    paddingHorizontal: t.spacing.xs,
    borderRadius: t.radius.pill,
    backgroundColor: t.colors.surfaceMuted,
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.xs,
  },
  compact: { height: 38 },
  button: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  value: { minWidth: 24, textAlign: 'center' },
  disabled: { opacity: 0.3 },
  pressed: { opacity: 0.6 },
}));
