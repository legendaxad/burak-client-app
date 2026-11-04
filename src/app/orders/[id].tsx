import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AppIcon, AppScreen, EmptyState, LoadingPanel, PageHeader, PrimaryButton, StatusBadge, Surface } from '@/components/app-ui';
import { useAppData } from '@/context/app-context';
import { colors, radius, spacing } from '@/theme/colors';
import type { OrderStatus } from '@/types/models';

const milestones: OrderStatus[] = ['Pending', 'Preparing', 'Ready', 'Completed'];

export default function OrderDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { ready, orders, products, addToCart } = useAppData();
  const order = orders.find((item) => item.id === id);

  const handleReorder = () => {
    if (!order) return;
    order.items.forEach((item) => {
      const product = products.find((candidate) => candidate.id === item.productId);
      const extraIds = product?.extras.filter((extra) => item.extras.includes(extra.name)).map((extra) => extra.id) ?? [];
      addToCart(item.productId, item.quantity, extraIds);
    });
    router.push('/cart');
  };

  if (!ready) return <AppScreen><PageHeader title="Order details" back /><LoadingPanel message="Loading order details…" /></AppScreen>;
  if (!order) return <AppScreen><PageHeader title="Order details" back /><View style={styles.missing}><EmptyState icon="receipt" title="We couldn’t find that order" message="Your order may have been removed from this demo device." /></View></AppScreen>;

  const currentStep = order.status === 'Cancelled' ? -1 : milestones.indexOf(order.status);
  return (
    <AppScreen contentStyle={styles.screen}>
      <PageHeader title="Order details" subtitle={order.id} back action={<StatusBadge status={order.status} />} />
      <View style={styles.content}>
        <Surface style={styles.progressCard}>
          <View style={styles.progressHeader}><View><Text style={styles.progressTitle}>{order.status === 'Completed' ? 'Delivered with care' : order.status === 'Cancelled' ? 'Order cancelled' : 'On its way to the kitchen'}</Text><Text style={styles.progressSubtitle}>{order.status === 'Cancelled' ? 'Contact us if you need help.' : `Estimated delivery · ${order.eta}`}</Text></View><View style={styles.truckIcon}><AppIcon name="truck" size={19} color={colors.goldDeep} /></View></View>
          {order.status !== 'Cancelled' ? <View style={styles.timeline}>{milestones.map((step, index) => {
            const complete = index <= currentStep;
            return <View key={step} style={styles.timelineStep}><View style={[styles.timelineDot, complete && styles.timelineDotActive]}>{complete ? <AppIcon name="check" size={10} color={colors.ink} /> : null}</View><Text style={[styles.timelineLabel, complete && styles.timelineLabelActive]}>{step}</Text>{index < milestones.length - 1 ? <View style={[styles.timelineLine, index < currentStep && styles.timelineLineActive]} /> : null}</View>;
          })}</View> : null}
        </Surface>

        <Surface style={styles.card}>
          <Text style={styles.sectionTitle}>What you ordered</Text>
          {order.items.map((item) => <View key={item.productId} style={styles.itemRow}>
            <Image source={item.image} style={styles.itemImage} contentFit="cover" cachePolicy="memory-disk" />
            <View style={styles.itemCopy}><Text style={styles.itemName}>{item.quantity} × {item.name}</Text>{item.extras.length ? <Text numberOfLines={1} style={styles.itemExtras}>{item.extras.join(', ')}</Text> : null}</View>
            <Text style={styles.itemPrice}>{`$${(item.quantity * item.unitPrice).toFixed(2)}`}</Text>
          </View>)}
          <View style={styles.divider} />
          <View style={styles.moneyRow}><Text style={styles.muted}>Subtotal</Text><Text style={styles.moneyValue}>{`$${order.subtotal.toFixed(2)}`}</Text></View>
          <View style={styles.moneyRow}><Text style={styles.muted}>Delivery</Text><Text style={styles.moneyValue}>{order.deliveryFee === 0 ? 'Free' : `$${order.deliveryFee.toFixed(2)}`}</Text></View>
          <View style={styles.moneyRow}><Text style={styles.totalLabel}>Total</Text><Text style={styles.totalValue}>{`$${order.total.toFixed(2)}`}</Text></View>
        </Surface>

        <Surface style={styles.card}>
          <Text style={styles.sectionTitle}>Delivery details</Text>
          <View style={styles.detailLine}><AppIcon name="profile" size={16} color={colors.muted} /><Text style={styles.detailValue}>{order.customer.name}</Text></View>
          <View style={styles.detailLine}><AppIcon name="phone" size={16} color={colors.muted} /><Text style={styles.detailValue}>{order.customer.phone}</Text></View>
          <View style={styles.detailLine}><AppIcon name="pin" size={16} color={colors.muted} /><Text style={styles.detailValue}>{order.customer.address}</Text></View>
          {order.customer.instructions ? <View style={styles.detailLine}><AppIcon name="info" size={16} color={colors.muted} /><Text style={styles.detailValue}>{order.customer.instructions}</Text></View> : null}
          <View style={styles.detailLine}><AppIcon name="bag" size={16} color={colors.muted} /><Text style={styles.detailValue}>{order.paymentMethod}</Text></View>
        </Surface>

        <PrimaryButton title="Order these again" onPress={handleReorder} icon="bag" />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingBottom: 32 },
  content: { paddingHorizontal: spacing.xl, gap: 13 },
  progressCard: { gap: 18 },
  progressHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  progressTitle: { color: colors.text, fontSize: 14, fontWeight: '800' },
  progressSubtitle: { color: colors.muted, fontSize: 10, marginTop: 4 },
  truckIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#F5EBD9', alignItems: 'center', justifyContent: 'center' },
  timeline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  timelineStep: { flex: 1, alignItems: 'center', position: 'relative', gap: 6 },
  timelineDot: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: colors.line, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  timelineDotActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  timelineLabel: { color: colors.muted, fontSize: 8, textAlign: 'center' },
  timelineLabelActive: { color: colors.text, fontWeight: '700' },
  timelineLine: { position: 'absolute', top: 8, left: '57%', right: '-43%', height: 2, backgroundColor: colors.line },
  timelineLineActive: { backgroundColor: colors.goldDeep },
  card: { gap: 12 },
  sectionTitle: { color: colors.text, fontSize: 14, fontWeight: '800', marginBottom: 1 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  itemImage: { width: 48, height: 48, borderRadius: radius.sm, backgroundColor: '#E6E0D6' },
  itemCopy: { flex: 1, gap: 4 },
  itemName: { color: colors.text, fontSize: 11, fontWeight: '700' },
  itemExtras: { color: colors.muted, fontSize: 9 },
  itemPrice: { color: colors.text, fontSize: 11, fontWeight: '800' },
  divider: { height: 1, backgroundColor: colors.line },
  moneyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  muted: { color: colors.muted, fontSize: 11 },
  moneyValue: { color: colors.text, fontSize: 11, fontWeight: '700' },
  totalLabel: { color: colors.text, fontSize: 13, fontWeight: '800' },
  totalValue: { color: colors.text, fontSize: 14, fontWeight: '900' },
  detailLine: { flexDirection: 'row', alignItems: 'flex-start', gap: 9 },
  detailValue: { flex: 1, color: colors.text, fontSize: 11, lineHeight: 17 },
  missing: { paddingHorizontal: spacing.xl },
});
