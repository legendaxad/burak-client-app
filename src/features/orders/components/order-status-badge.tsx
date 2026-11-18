import { View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { Icon } from '@/components/common/icon';
import { makeStyles, useTheme, type ThemeColors } from '@/theme';

import type { OrderStatus } from '../types';
import { ORDER_STATUS_META, type StatusTone } from '../utils/order-status';

const toneColors: Record<StatusTone, { fg: keyof ThemeColors; bg: keyof ThemeColors }> = {
  accent: { fg: 'primaryStrong', bg: 'accentSoft' },
  info: { fg: 'info', bg: 'infoSoft' },
  success: { fg: 'success', bg: 'successSoft' },
  danger: { fg: 'danger', bg: 'dangerSoft' },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const meta = ORDER_STATUS_META[status] ?? ORDER_STATUS_META.PAUSE;
  const tone = toneColors[meta.tone];
  return (
    <View style={[styles.badge, { backgroundColor: colors[tone.bg] }]} accessibilityLabel={`Status: ${meta.label}`}>
      <Icon name={meta.icon} size={13} color={colors[tone.fg]} />
      <AppText variant="caption" style={[styles.text, { color: colors[tone.fg] }]}>
        {meta.label}
      </AppText>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.xs,
    alignSelf: 'flex-start',
    paddingHorizontal: t.spacing.sm + 2,
    paddingVertical: t.spacing.xs,
    borderRadius: t.radius.pill,
  },
  text: { fontWeight: '800', fontSize: 11 },
}));
