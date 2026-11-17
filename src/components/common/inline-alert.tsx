import { View } from 'react-native';

import { makeStyles, useTheme } from '@/theme';

import { AppText } from './app-text';
import { Icon } from './icon';

/** Compact message box for form-level errors and notices. */
export function InlineAlert({ message, tone = 'danger' }: { message: string; tone?: 'danger' | 'info' }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const color = tone === 'danger' ? colors.danger : colors.info;
  return (
    <View
      style={[styles.box, tone === 'danger' ? styles.danger : styles.info]}
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
    >
      <Icon name={tone === 'danger' ? 'warning' : 'info'} size={18} color={color} />
      <AppText variant="caption" style={[styles.text, { color }]}>
        {message}
      </AppText>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.sm,
    padding: t.spacing.md,
    borderRadius: t.radius.md,
  },
  danger: { backgroundColor: t.colors.dangerSoft },
  info: { backgroundColor: t.colors.infoSoft },
  text: { flex: 1, fontWeight: '600' },
}));
