import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppIcon, AppScreen, EmptyState, PageHeader, PrimaryButton, QuantityStepper, SectionTitle, Surface } from '@/components/app-ui';
import { useAppData } from '@/context/app-context';
import { colors, radius, spacing } from '@/theme/colors';
import type { CartLine } from '@/types/models';

function CartItem({ line, onQuantityChange, onRemove }: { line: CartLine; onQuantityChange: (quantity: number) => void; onRemove: () => void }) {
  const unitPrice = line.product.price + line.extras.reduce((sum, extra) => sum + extra.price, 0);
  return (
    <View style={styles.cartItem}>
      <Image source={line.product.image} style={styles.itemImage} contentFit="cover" cachePolicy="memory-disk" />
      <View style={styles.itemCopy}>
        <Text numberOfLines={1} style={styles.itemName}>{line.product.name}</Text>
        {line.extras.length ? <Text numberOfLines={1} style={styles.itemExtras}>{line.extras.map((extra) => extra.name).join(', ')}</Text> : null}
        <Text style={styles.itemUnit}>{`$${unitPrice.toFixed(2)} each`}</Text>
        <QuantityStepper value={line.quantity} onChange={onQuantityChange} compact />
      </View>
      <View style={styles.itemRight}>
        <Text style={styles.itemTotal}>{`$${(unitPrice * line.quantity).toFixed(2)}`}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${line.product.name}`} onPress={onRemove} hitSlop={8} style={styles.removeButton}><AppIcon name="trash" size={16} color={colors.muted} /></Pressable>
      </View>
    </View>
  );
}

export default function CartScreen() {
  const { cart, setCartQuantity, removeFromCart, subtotal, deliveryFee, total, restaurant } = useAppData();
  const freeDeliveryRemaining = Math.max(0, restaurant.freeDeliveryMinimum - subtotal);

  return (
    <AppScreen contentStyle={styles.screen}>
      <PageHeader title="Your cart" subtitle={cart.length ? 'A very good meal is on its way.' : 'Something delicious is just a few taps away.'} />
      <View style={styles.content}>
        {!cart.length ? (
          <EmptyState icon="bag" title="Your cart is taking a little break" message="Explore the menu and add a favorite to get started." action={<PrimaryButton title="Explore the menu" onPress={() => router.navigate('/menu')} icon="menu" />} />
        ) : (
          <>
            <View style={styles.itemsList}>
              {cart.map((line) => <CartItem key={line.id} line={line} onQuantityChange={(quantity) => setCartQuantity(line.id, quantity)} onRemove={() => removeFromCart(line.id)} />)}
            </View>
            <Pressable accessibilityRole="button" onPress={() => router.navigate('/menu')} style={styles.addMore}><View style={styles.addMoreIcon}><AppIcon name="plus" size={16} color={colors.goldDeep} /></View><Text style={styles.addMoreText}>Add another dish</Text><AppIcon name="next" size={15} color={colors.muted} /></Pressable>

            <Surface style={styles.summary}>
              <SectionTitle title="Order summary" />
              <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Subtotal</Text><Text style={styles.summaryValue}>{`$${subtotal.toFixed(2)}`}</Text></View>
              <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Delivery</Text><Text style={[styles.summaryValue, deliveryFee === 0 && styles.freeDelivery]}>{deliveryFee === 0 ? 'Free' : `$${deliveryFee.toFixed(2)}`}</Text></View>
              <View style={styles.divider} />
              <View style={styles.summaryRow}><Text style={styles.totalLabel}>Total</Text><Text style={styles.totalValue}>{`$${total.toFixed(2)}`}</Text></View>
              {freeDeliveryRemaining > 0 ? <Text style={styles.deliveryHint}>{`Add $${freeDeliveryRemaining.toFixed(2)} more for free delivery.`}</Text> : <Text style={styles.deliveryHint}>Free delivery has been applied to your order.</Text>}
            </Surface>
            <PrimaryButton title={`Continue to checkout · $${total.toFixed(2)}`} onPress={() => router.push('/checkout')} icon="next" />
            <View style={styles.checkoutNote}><AppIcon name="check" size={13} color={colors.green} /><Text style={styles.checkoutNoteText}>Secure checkout · Pay when your order arrives</Text></View>
          </>
        )}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingBottom: 34 },
  content: { paddingHorizontal: spacing.xl, gap: 15 },
  itemsList: { gap: 11 },
  cartItem: { minHeight: 126, padding: 10, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, flexDirection: 'row', gap: 11 },
  itemImage: { width: 88, height: 105, borderRadius: radius.md, backgroundColor: '#E6E0D6' },
  itemCopy: { flex: 1, gap: 4, justifyContent: 'center', minWidth: 0 },
  itemName: { color: colors.text, fontSize: 12, fontWeight: '800' },
  itemExtras: { color: colors.muted, fontSize: 9 },
  itemUnit: { color: colors.muted, fontSize: 10, marginBottom: 2 },
  itemRight: { minWidth: 50, alignItems: 'flex-end', justifyContent: 'space-between', paddingVertical: 2 },
  itemTotal: { color: colors.text, fontSize: 12, fontWeight: '800' },
  removeButton: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  addMore: { minHeight: 43, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 2 },
  addMoreIcon: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#F5EBD9', alignItems: 'center', justifyContent: 'center' },
  addMoreText: { flex: 1, color: colors.text, fontSize: 12, fontWeight: '700' },
  summary: { gap: 12 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  summaryLabel: { color: colors.muted, fontSize: 12 },
  summaryValue: { color: colors.text, fontSize: 12, fontWeight: '700' },
  freeDelivery: { color: colors.green },
  divider: { height: 1, backgroundColor: colors.line },
  totalLabel: { color: colors.text, fontSize: 14, fontWeight: '800' },
  totalValue: { color: colors.text, fontSize: 17, fontWeight: '900' },
  deliveryHint: { color: colors.goldDeep, fontSize: 10, fontWeight: '600' },
  checkoutNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  checkoutNoteText: { color: colors.muted, fontSize: 10, textAlign: 'center' },
});
