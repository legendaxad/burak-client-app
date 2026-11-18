import { router } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/buttons/button';
import { AppText } from '@/components/common/app-text';
import { Icon } from '@/components/common/icon';
import { EmptyState, LoadingView } from '@/components/common/state-message';
import { PageHeader } from '@/components/layouts/page-header';
import { Screen } from '@/components/layouts/screen';
import { useCartLines } from '@/features/cart/hooks/use-cart-lines';
import { estimateDelivery } from '@/features/cart/utils/cart-lines';
import { makeStyles, useTheme } from '@/theme';
import { formatPrice } from '@/utils/format-price';

import { usePlaceOrder } from '../hooks/use-place-order';
import { describeCheckoutError } from '../utils/checkout-messages';

export function CheckoutScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { lines, summary, hasHydrated, refetch } = useCartLines();
  const placeOrder = usePlaceOrder();

  // Re-read every product when checkout opens: the customer reviews current prices.
  useEffect(() => {
    void refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per visit
  }, []);

  const reviewedPrices = useMemo(
    () =>
      Object.fromEntries(
        lines.flatMap((line) => (line.product ? [[line.productId, line.product.productPrice] as const] : [])),
      ),
    [lines],
  );

  if (placeOrder.isSuccess) {
    // The ordered items were just removed from the cart; navigation to the order follows.
    return (
      <Screen>
        <PageHeader title="Checkout" />
        <LoadingView message="Order placed. Opening it…" />
      </Screen>
    );
  }

  if (!hasHydrated || (summary.isLoading && lines.length > 0)) {
    return (
      <Screen>
        <PageHeader back title="Checkout" />
        <LoadingView message="Checking prices and availability…" />
      </Screen>
    );
  }

  if (lines.length === 0) {
    return (
      <Screen>
        <PageHeader back title="Checkout" />
        <View style={styles.padded}>
          <EmptyState
            icon="bag"
            title="Nothing to check out"
            message="Your cart is empty."
            action={<Button title="Browse the menu" onPress={() => router.navigate('/menu')} />}
          />
        </View>
      </Screen>
    );
  }

  const delivery = estimateDelivery(summary.subtotal);
  const errorView = placeOrder.isError ? describeCheckoutError(placeOrder.error) : null;

  const onPlaceOrder = () =>
    placeOrder.placeOrder(
      { items: lines.map(({ productId, quantity }) => ({ productId, quantity })), reviewedPrices },
      {
        onSuccess: (order) =>
          router.replace({ pathname: '/orders/[id]', params: { id: order._id, placed: '1' } }),
      },
    );

  return (
    <Screen edges={['top', 'left', 'right', 'bottom']}>
      <PageHeader back title="Checkout" subtitle="Review your order before sending it to the kitchen." />
      <View style={styles.body}>
        <View style={styles.card}>
          <AppText variant="subheading">Items</AppText>
          {lines.map((line) => (
            <View key={line.productId} style={styles.lineRow}>
              <AppText style={styles.lineName} numberOfLines={2}>
                <AppText variant="bodyStrong">{line.quantity} ×</AppText> {line.product?.productName ?? 'Unavailable item'}
              </AppText>
              <AppText variant="bodyStrong" tone={line.state === 'ok' ? 'default' : 'danger'}>
                {line.state === 'ok' ? formatPrice(line.lineTotal) : 'Unavailable'}
              </AppText>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <SummaryRow label="Subtotal" value={formatPrice(summary.subtotal)} />
          <SummaryRow label="Delivery (estimated)" value={delivery ? formatPrice(delivery) : 'Free'} />
          <View style={styles.divider} />
          <SummaryRow label="Estimated total" value={formatPrice(summary.subtotal + delivery)} strong />
          <AppText variant="caption" tone="muted">
            The kitchen confirms the final total when the order is created.
          </AppText>
        </View>

        <View style={[styles.card, styles.note]}>
          <Icon name="info" size={18} color={colors.info} />
          <AppText variant="caption" style={styles.noteText}>
            No payment is taken in the app, and orders are linked to your account without a separate delivery address.
            After placing the order, confirm it from My orders to send it to the kitchen.
          </AppText>
        </View>

        {errorView ? (
          <View style={[styles.card, styles.errorCard]} accessibilityRole="alert" accessibilityLiveRegion="assertive">
            <AppText variant="bodyStrong" tone="danger">
              {errorView.title}
            </AppText>
            {errorView.lines.map((line) => (
              <AppText key={line} variant="caption">
                {line}
              </AppText>
            ))}
            {errorView.needsCartReview ? (
              <Button title="Review cart" variant="secondary" onPress={() => router.navigate('/cart')} />
            ) : null}
          </View>
        ) : null}

        {!summary.canCheckout && !placeOrder.isPending ? (
          <AppText variant="caption" tone="danger">
            Some items are unavailable or exceed the stock. Update your cart to continue.
          </AppText>
        ) : null}

        <Button
          title="Place order"
          icon="check"
          fullWidth
          loading={placeOrder.isPending}
          disabled={!summary.canCheckout}
          onPress={onPlaceOrder}
          testID="place-order"
        />
      </View>
    </Screen>
  );
}

function SummaryRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  const styles = useStyles();
  return (
    <View style={styles.summaryRow}>
      <AppText tone={strong ? 'default' : 'muted'} variant={strong ? 'bodyStrong' : 'body'}>
        {label}
      </AppText>
      <AppText variant={strong ? 'heading' : 'bodyStrong'}>{value}</AppText>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  padded: { paddingHorizontal: t.spacing.xl },
  body: { paddingHorizontal: t.spacing.xl, gap: t.spacing.lg },
  card: {
    backgroundColor: t.colors.surface,
    borderRadius: t.radius.lg,
    borderWidth: 1,
    borderColor: t.colors.border,
    padding: t.spacing.lg,
    gap: t.spacing.sm,
  },
  lineRow: { flexDirection: 'row', justifyContent: 'space-between', gap: t.spacing.md },
  lineName: { flex: 1 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  divider: { height: 1, backgroundColor: t.colors.border, marginVertical: t.spacing.xs },
  note: { flexDirection: 'row', backgroundColor: t.colors.infoSoft, borderColor: 'transparent' },
  noteText: { flex: 1, color: t.colors.text },
  errorCard: { backgroundColor: t.colors.dangerSoft, borderColor: 'transparent' },
}));
