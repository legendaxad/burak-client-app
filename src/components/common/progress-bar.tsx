import { View } from 'react-native';

import { makeStyles } from '@/theme';

import { AppText } from './app-text';

/** Determinate progress (0–1) with a label, e.g. for uploads. */
export function ProgressBar({ value, label }: { value: number; label: string }) {
  const styles = useStyles();
  const percent = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <View
      style={styles.root}
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: percent }}
    >
      <View style={styles.labelRow}>
        <AppText variant="caption" tone="muted">
          {label}
        </AppText>
        <AppText variant="caption" tone="muted">
          {percent}%
        </AppText>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${percent}%` }]} />
      </View>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  root: { gap: t.spacing.xs },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  track: { height: 6, borderRadius: 3, backgroundColor: t.colors.surfaceMuted, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: t.colors.primaryStrong },
}));
