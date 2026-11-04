import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AppIcon, AppScreen, PageHeader, PrimaryButton, Surface } from '@/components/app-ui';
import { useAppData } from '@/context/app-context';
import { colors, radius, spacing } from '@/theme/colors';

export default function OrderConfirmationScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { orders } = useAppData();
  const order = orders.find((item) => item.id === id) ?? orders[0];

  return (
    <AppScreen contentStyle={styles.screen}>
      <PageHeader title="Order received" subtitle="We’ve sent your order to the kitchen." />
      <View style={styles.content}>
        <View style={styles.successIcon}><AppIcon name="check" size={31} color={colors.ink} /></View>
        <Text style={styles.title}>That’s a lovely choice.</Text>
        <Text style={styles.copy}>Your meal is being prepared with care. We’ll have it at your door in about {order?.eta ?? '25–35 min'}.</Text>
        {order ? <Surface style={styles.orderCard}>
          <View style={styles.orderTop}><View><Text style={styles.eyebrow}>ORDER NUMBER</Text><Text style={styles.orderNumber}>{order.id}</Text></View><View style={styles.orderIcon}><AppIcon name="receipt" size={18} color={colors.goldDeep} /></View></View>
          <View style={styles.divider} />
          {order.items.map((item) => <View key={item.productId} style={styles.itemRow}><Text style={styles.itemName}>{item.quantity} × {item.name}</Text><Text style={styles.itemPrice}>{`$${(item.quantity * item.unitPrice).toFixed(2)}`}</Text></View>)}
          <View style={styles.divider} />
          <View style={styles.totalRow}><Text style={styles.totalLabel}>Total</Text><Text style={styles.totalPrice}>{`$${order.total.toFixed(2)}`}</Text></View>
          <View style={styles.etaRow}><AppIcon name="clock" size={14} color={colors.blue} /><Text style={styles.etaText}>Estimated delivery · {order.eta}</Text></View>
        </Surface> : null}
        <PrimaryButton title="View order details" onPress={() => order && router.replace({ pathname: '/orders/[id]', params: { id: order.id } })} icon="orders" secondary={!order} disabled={!order} />
        <PrimaryButton title="Back to home" onPress={() => router.replace('/')} />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingBottom: 36 },
  content: { paddingHorizontal: spacing.xl, alignItems: 'center', gap: 14 },
  successIcon: { width: 68, height: 68, borderRadius: 34, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  title: { color: colors.text, fontSize: 22, fontWeight: '900', textAlign: 'center' },
  copy: { color: colors.muted, fontSize: 12, lineHeight: 19, textAlign: 'center', maxWidth: 290 },
  orderCard: { width: '100%', gap: 12, marginTop: 5 },
  orderTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eyebrow: { color: colors.muted, fontSize: 8, fontWeight: '800', letterSpacing: 1 },
  orderNumber: { color: colors.text, fontSize: 16, fontWeight: '900', marginTop: 4 },
  orderIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#F5EBD9', alignItems: 'center', justifyContent: 'center' },
  divider: { height: 1, backgroundColor: colors.line },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  itemName: { flex: 1, color: colors.muted, fontSize: 11 },
  itemPrice: { color: colors.text, fontSize: 11, fontWeight: '700' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalLabel: { color: colors.text, fontSize: 13, fontWeight: '800' },
  totalPrice: { color: colors.text, fontSize: 15, fontWeight: '900' },
  etaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.bluePale, borderRadius: radius.sm, padding: 10 },
  etaText: { color: colors.blue, fontSize: 10, fontWeight: '700' },
});
