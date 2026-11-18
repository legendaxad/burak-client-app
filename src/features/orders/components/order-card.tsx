import { router } from 'expo-router';
import { memo, useMemo } from 'react';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { Skeleton } from '@/components/common/skeleton';
import { makeStyles } from '@/theme';
import { formatDateTime } from '@/utils/format-date';
import { formatPrice } from '@/utils/format-price';

import type { OrderWithItems } from '../types';
import { buildOrderLines, summarizeOrderItems } from '../utils/order-lines';
import { formatOrderNumber, ORDER_STATUS_META } from '../utils/order-status';
import { OrderStatusBadge } from './order-status-badge';

export const OrderCard = memo(function OrderCard({ order }: { order: OrderWithItems }) {
  const styles = useStyles();
  const lines = useMemo(() => buildOrderLines(order), [order]);
  const number = formatOrderNumber(order._id);
  const total = formatPrice(order.orderTotal);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Order ${number}, ${ORDER_STATUS_META[order.orderStatus]?.label ?? order.orderStatus}, ${total}`}
      onPress={() => router.push({ pathname: '/orders/[id]', params: { id: order._id } })}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.top}>
        <View style={styles.titleBlock}>
          <AppText variant="bodyStrong">Order {number}</AppText>
          <AppText variant="caption" tone="muted">
            {formatDateTime(order.createdAt)}
          </AppText>
        </View>
        <OrderStatusBadge status={order.orderStatus} />
      </View>
      <View style={styles.divider} />
      <AppText variant="caption" tone="muted" numberOfLines={2}>
        {summarizeOrderItems(lines)}
      </AppText>
      <View style={styles.bottom}>
        <AppText variant="caption" tone="muted">
          {lines.reduce((sum, line) => sum + line.quantity, 0)} items
        </AppText>
        <AppText variant="bodyStrong">{total}</AppText>
      </View>
    </Pressable>
  );
});

export function OrderCardSkeleton() {
  const styles = useStyles();
  return (
    <View style={styles.card} accessibilityLabel="Loading order">
      <View style={styles.top}>
        <View style={styles.titleBlock}>
          <Skeleton width={120} height={14} />
          <Skeleton width={90} height={11} />
        </View>
        <Skeleton width={110} height={24} radius={12} />
      </View>
      <Skeleton width="80%" height={12} />
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  card: {
    backgroundColor: t.colors.surface,
    borderRadius: t.radius.lg,
    borderWidth: 1,
    borderColor: t.colors.border,
    padding: t.spacing.lg,
    gap: t.spacing.sm + 2,
  },
  pressed: { opacity: 0.8 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: t.spacing.md },
  titleBlock: { flex: 1, gap: t.spacing.xxs + 1 },
  divider: { height: 1, backgroundColor: t.colors.border },
  bottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
}));
