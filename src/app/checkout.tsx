import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppIcon, AppScreen, EmptyState, Field, PageHeader, PrimaryButton, SectionTitle, Surface } from '@/components/app-ui';
import { useAppData } from '@/context/app-context';
import { colors, radius, spacing } from '@/theme/colors';
import type { PaymentMethod } from '@/types/models';

const paymentMethods: { value: PaymentMethod; title: string; description: string; icon: string }[] = [
  { value: 'Cash on delivery', title: 'Cash on delivery', description: 'Pay in cash when your order arrives.', icon: 'bag' },
  { value: 'Card on delivery', title: 'Card on delivery', description: 'A mock option for future card payments.', icon: 'receipt' },
];

export default function CheckoutScreen() {
  const { ready, cart, customer, subtotal, deliveryFee, total, placeOrder } = useAppData();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [instructions, setInstructions] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash on delivery');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!ready) return;
    setName(customer.name);
    setPhone(customer.phone);
    setAddress(customer.address);
    setInstructions(customer.instructions);
  }, [customer, ready]);

  const handleConfirm = async () => {
    if (!name.trim() || !phone.trim() || !address.trim()) {
      setError('Please add your name, phone number, and delivery address.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const order = await placeOrder({ name, phone, address, instructions, paymentMethod });
      router.replace({ pathname: '/order-confirmation', params: { id: order.id } });
    } catch {
      setError('We could not save the mock order. Please try again.');
      setSaving(false);
    }
  };

  return (
    <AppScreen contentStyle={styles.screen}>
      <PageHeader title="Almost there" subtitle="A few details and we’ll get dinner on its way." back />
      <View style={styles.content}>
        {!cart.length ? <EmptyState icon="bag" title="Your cart is empty" message="Add a dish before continuing to checkout." action={<PrimaryButton title="Browse the menu" onPress={() => router.replace('/menu')} icon="menu" />} /> : (
          <>
            <Surface style={styles.sectionCard}>
              <SectionTitle title="Delivery details" />
              <Field label="Full name" value={name} onChangeText={setName} placeholder="Your name" />
              <Field label="Phone number" value={phone} onChangeText={setPhone} placeholder="(555) 000-0000" keyboardType="phone-pad" />
              <Field label="Delivery address" value={address} onChangeText={setAddress} placeholder="Street, city, apartment" />
              <Field label="Delivery instructions" value={instructions} onChangeText={setInstructions} placeholder="Gate code, lobby, or other notes (optional)" multiline />
            </Surface>

            <View style={styles.paymentSection}>
              <View><Text style={styles.sectionTitle}>Payment method</Text><Text style={styles.sectionSubtitle}>No real payment is collected in this demo.</Text></View>
              {paymentMethods.map((method) => {
                const selected = paymentMethod === method.value;
                return (
                  <Pressable key={method.value} accessibilityRole="radio" accessibilityState={{ selected }} onPress={() => setPaymentMethod(method.value)} style={[styles.paymentOption, selected && styles.paymentOptionSelected]}>
                    <View style={[styles.paymentIcon, selected && styles.paymentIconSelected]}><AppIcon name={method.icon} size={18} color={selected ? colors.goldDeep : colors.muted} /></View>
                    <View style={styles.paymentCopy}><Text style={styles.paymentTitle}>{method.title}</Text><Text style={styles.paymentDescription}>{method.description}</Text></View>
                    <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>{selected ? <View style={styles.radioInner} /> : null}</View>
                  </Pressable>
                );
              })}
            </View>

            <Surface style={styles.sectionCard}>
              <SectionTitle title="Order summary" />
              {cart.map((line) => <View key={line.id} style={styles.itemLine}><Text numberOfLines={1} style={styles.itemName}>{line.quantity} × {line.product.name}</Text><Text style={styles.itemAmount}>{`$${((line.product.price + line.extras.reduce((sum, extra) => sum + extra.price, 0)) * line.quantity).toFixed(2)}`}</Text></View>)}
              <View style={styles.divider} />
              <View style={styles.itemLine}><Text style={styles.label}>Subtotal</Text><Text style={styles.itemAmount}>{`$${subtotal.toFixed(2)}`}</Text></View>
              <View style={styles.itemLine}><Text style={styles.label}>Delivery</Text><Text style={[styles.itemAmount, deliveryFee === 0 && styles.free]}>{deliveryFee === 0 ? 'Free' : `$${deliveryFee.toFixed(2)}`}</Text></View>
              <View style={styles.itemLine}><Text style={styles.totalLabel}>Total</Text><Text style={styles.totalAmount}>{`$${total.toFixed(2)}`}</Text></View>
            </Surface>

            {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
            <PrimaryButton title={`Confirm order · $${total.toFixed(2)}`} onPress={() => void handleConfirm()} loading={saving} icon="check" />
            <Text style={styles.mockNote}>This creates a local mock order and does not process payment.</Text>
          </>
        )}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingBottom: 32 },
  content: { paddingHorizontal: spacing.xl, gap: 15 },
  sectionCard: { gap: 13 },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: '800' },
  sectionSubtitle: { color: colors.muted, fontSize: 11, marginTop: 3 },
  paymentSection: { gap: 10 },
  paymentOption: { minHeight: 72, padding: 11, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', gap: 10 },
  paymentOptionSelected: { borderColor: colors.goldDeep, backgroundColor: '#FCF8F0' },
  paymentIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center' },
  paymentIconSelected: { backgroundColor: '#F5EBD9' },
  paymentCopy: { flex: 1, gap: 3 },
  paymentTitle: { color: colors.text, fontSize: 12, fontWeight: '800' },
  paymentDescription: { color: colors.muted, fontSize: 10, lineHeight: 14 },
  radioOuter: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  radioOuterSelected: { borderColor: colors.goldDeep },
  radioInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.goldDeep },
  itemLine: { minHeight: 23, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  itemName: { flex: 1, color: colors.muted, fontSize: 11 },
  itemAmount: { color: colors.text, fontSize: 11, fontWeight: '700' },
  label: { color: colors.muted, fontSize: 11 },
  free: { color: colors.green },
  divider: { height: 1, backgroundColor: colors.line, marginVertical: 2 },
  totalLabel: { color: colors.text, fontSize: 13, fontWeight: '800' },
  totalAmount: { color: colors.text, fontSize: 15, fontWeight: '900' },
  error: { color: colors.red, fontSize: 12, fontWeight: '600' },
  mockNote: { color: colors.muted, fontSize: 10, textAlign: 'center' },
});
