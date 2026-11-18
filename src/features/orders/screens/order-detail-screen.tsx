import { router } from 'expo-router';
import { useMemo } from 'react';
import { Alert, Pressable, RefreshControl, View } from 'react-native';

import { Button } from '@/components/buttons/button';
import { AppText } from '@/components/common/app-text';
import { Icon } from '@/components/common/icon';
import { InlineAlert } from '@/components/common/inline-alert';
import { Skeleton } from '@/components/common/skeleton';
import { ErrorState } from '@/components/common/state-message';
import { PageHeader } from '@/components/layouts/page-header';
import { Screen } from '@/components/layouts/screen';
import { ProductImage } from '@/features/products/components/product-image';
import { getErrorMessage, isApiError } from '@/services/api';
import { makeStyles, useTheme } from '@/theme';
import { formatDateTime } from '@/utils/format-date';
import { formatPrice } from '@/utils/format-price';

import { OrderStatusBadge } from '../components/order-status-badge';
import { useOrderAction } from '../hooks/use-order-action';
import { useOrder } from '../hooks/use-orders';
import type { OrderWithItems } from '../types';
import { buildOrderLines, itemsSubtotal, type OrderLine } from '../utils/order-lines';
import { availableActions, formatOrderNumber, ORDER_STATUS_META, type OrderAction } from '../utils/order-status';

export function OrderDetailScreen({ id, justPlaced }: { id: string; justPlaced: boolean }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const query = useOrder(id);

  return (
    <Screen
      refreshControl={
        <RefreshControl
          refreshing={query.isRefetching && !query.isPlaceholderData}
          onRefresh={() => void query.refetch()}
          tintColor={colors.primaryStrong}
          colors={[colors.primaryStrong]}
        />
      }
    >
      <PageHeader back title={`Order ${formatOrderNumber(id)}`} />
      <View style={styles.body}>
        {query.data ? (
          <OrderDetail order={query.data} justPlaced={justPlaced} isStale={query.isPlaceholderData} />
        ) : query.isError ? (
          <ErrorState
            title={isApiError(query.error) && query.error.status === 404 ? 'Order not found' : 'Could not load this order'}
            message={
              isApiError(query.error) && query.error.status === 404
                ? 'It does not exist or does not belong to your account.'
                : getErrorMessage(query.error)
            }
            onRetry={() => void query.refetch()}
            action={<Button title="All orders" variant="ghost" onPress={() => router.navigate('/orders')} />}
          />
        ) : (
          <DetailSkeleton />
        )}
      </View>
    </Screen>
  );
}

function OrderDetail({ order, justPlaced, isStale }: { order: OrderWithItems; justPlaced: boolean; isStale: boolean }) {
  const styles = useStyles();
  const action = useOrderAction();
  const lines = useMemo(() => buildOrderLines(order), [order]);
  const meta = ORDER_STATUS_META[order.orderStatus];
  const actions = availableActions(order.orderStatus);

  const run = (selected: OrderAction) =>
    Alert.alert(selected.confirmTitle, selected.confirmMessage, [
      { text: 'Not now', style: 'cancel' },
      {
        text: selected.label,
        style: selected.destructive ? 'destructive' : 'default',
        onPress: () => action.mutate({ orderId: order._id, action: selected }),
      },
    ]);

  return (
    <>
      {justPlaced && order.orderStatus === 'PAUSE' ? (
        <InlineAlert tone="info" message="Order placed. Confirm it below to send it to the kitchen." />
      ) : null}

      <View style={styles.card}>
        <OrderStatusBadge status={order.orderStatus} />
        <AppText tone="muted">{meta?.description}</AppText>
        <View style={styles.metaRow}>
          <Icon name="calendar" size={15} />
          <AppText variant="caption" tone="muted">
            Placed {formatDateTime(order.createdAt)}
          </AppText>
        </View>
        <View style={styles.metaRow}>
          <Icon name="clock" size={15} />
          <AppText variant="caption" tone="muted">
            Updated {formatDateTime(order.updatedAt)}
          </AppText>
        </View>
      </View>

      <View style={styles.card}>
        <AppText variant="subheading">Items</AppText>
        {lines.length === 0 ? (
          <AppText tone="muted">No items were recorded for this order.</AppText>
        ) : (
          lines.map((line) => <OrderLineRow key={line.key} line={line} />)
        )}
      </View>

      <View style={styles.card}>
        <Row label="Items" value={formatPrice(itemsSubtotal(lines))} />
        <Row label="Delivery" value={order.orderDelivery ? formatPrice(order.orderDelivery) : 'Free'} />
        <View style={styles.divider} />
        <Row label="Total" value={formatPrice(order.orderTotal)} strong />
      </View>

      {action.isError ? <InlineAlert message={getErrorMessage(action.error)} /> : null}

      {actions.length > 0 ? (
        <View style={styles.actions}>
          {actions.map((item) => (
            <Button
              key={item.id}
              title={item.label}
              variant={item.destructive ? 'danger' : 'primary'}
              icon={item.destructive ? 'cancel' : 'check'}
              fullWidth
              loading={action.isPending && action.variables?.action.id === item.id}
              disabled={action.isPending || isStale}
              onPress={() => run(item)}
              testID={`order-action-${item.id}`}
            />
          ))}
        </View>
      ) : null}
    </>
  );
}

function OrderLineRow({ line }: { line: OrderLine }) {
  const styles = useStyles();
  const content = (
    <>
      <ProductImage
        path={line.product?.productImages[0]}
        collection={line.product?.productCollection ?? 'OTHER'}
        style={styles.thumb}
      />
      <View style={styles.lineBody}>
        <AppText variant="bodyStrong" numberOfLines={2} tone={line.product ? 'default' : 'muted'}>
          {line.name}
        </AppText>
        <AppText variant="caption" tone="muted">
          {line.quantity} × {formatPrice(line.unitPrice)}
        </AppText>
      </View>
      <AppText variant="bodyStrong">{formatPrice(line.lineTotal)}</AppText>
    </>
  );
  if (!line.product) return <View style={styles.line}>{content}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${line.name}, ${line.quantity} items`}
      onPress={() => router.push({ pathname: '/products/[id]', params: { id: line.productId } })}
      style={({ pressed }) => [styles.line, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  const styles = useStyles();
  return (
    <View style={styles.row}>
      <AppText tone={strong ? 'default' : 'muted'} variant={strong ? 'bodyStrong' : 'body'}>
        {label}
      </AppText>
      <AppText variant={strong ? 'heading' : 'bodyStrong'}>{value}</AppText>
    </View>
  );
}

function DetailSkeleton() {
  const styles = useStyles();
  return (
    <View style={styles.skeleton} accessibilityLabel="Loading order">
      <Skeleton height={110} radius={18} />
      <Skeleton height={160} radius={18} />
      <Skeleton height={90} radius={18} />
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  body: { paddingHorizontal: t.spacing.xl, gap: t.spacing.lg },
  card: {
    backgroundColor: t.colors.surface,
    borderRadius: t.radius.lg,
    borderWidth: 1,
    borderColor: t.colors.border,
    padding: t.spacing.lg,
    gap: t.spacing.sm + 2,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm },
  line: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.md },
  pressed: { opacity: 0.75 },
  thumb: { width: 52, height: 52, borderRadius: t.radius.sm },
  lineBody: { flex: 1, gap: t.spacing.xxs },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  divider: { height: 1, backgroundColor: t.colors.border },
  actions: { gap: t.spacing.md },
  skeleton: { gap: t.spacing.lg },
}));
