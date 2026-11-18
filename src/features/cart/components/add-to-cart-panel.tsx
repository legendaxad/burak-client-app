import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/buttons/button';
import { AppText } from '@/components/common/app-text';
import { Icon } from '@/components/common/icon';
import { QuantityStepper } from '@/components/inputs/quantity-stepper';
import type { Product } from '@/features/products/types';
import { useCartStore } from '@/store/cart/cart-store';
import { makeStyles, useTheme } from '@/theme';
import { formatPrice } from '@/utils/format-price';

import { maxQuantityFor } from '../utils/cart-logic';

const CONFIRMATION_MS = 3500;

/**
 * Sticky bottom panel on product detail. Quantity is limited by live stock minus
 * what is already in the cart. Paused, removed or sold-out products cannot be added.
 */
export function AddToCartPanel({ product, isStale }: { product: Product; isStale: boolean }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const inCart = useCartStore((state) => state.items.find((item) => item.productId === product._id)?.quantity ?? 0);
  const add = useCartStore((state) => state.add);
  const [quantity, setQuantity] = useState(1);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  const available = product.productStatus === 'PROCESS' && product.productLeftCount > 0;
  const remaining = Math.max(0, maxQuantityFor(product.productLeftCount) - inCart);
  const selected = Math.min(quantity, Math.max(remaining, 1));

  useEffect(() => {
    if (!confirmation) return;
    const timer = setTimeout(() => setConfirmation(null), CONFIRMATION_MS);
    return () => clearTimeout(timer);
  }, [confirmation]);

  const onAdd = () => {
    add(product._id, selected, product.productLeftCount);
    setConfirmation(`${selected} × ${product.productName} added to your cart`);
    setQuantity(1);
  };

  let note: string | null = null;
  if (!available) note = 'This item is sold out right now.';
  else if (remaining === 0) note = `You already have all ${inCart} available in your cart.`;
  else if (inCart > 0) note = `${inCart} already in your cart.`;

  return (
    <View style={[styles.panel, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      {confirmation ? (
        <View style={styles.confirmation} accessibilityRole="alert" accessibilityLiveRegion="polite">
          <Icon name="checkCircle" size={18} color={colors.success} />
          <AppText variant="caption" style={styles.confirmationText} numberOfLines={2}>
            {confirmation}
          </AppText>
          <Pressable accessibilityRole="link" hitSlop={10} onPress={() => router.navigate('/cart')}>
            <AppText variant="caption" tone="primary" style={styles.link}>
              View cart
            </AppText>
          </Pressable>
        </View>
      ) : note ? (
        <AppText variant="caption" tone={available ? 'muted' : 'danger'}>
          {note}
        </AppText>
      ) : null}

      <View style={styles.row}>
        <QuantityStepper
          value={selected}
          max={Math.max(remaining, 1)}
          onChange={setQuantity}
          label={product.productName}
          disabled={!available || remaining === 0}
        />
        <Button
          title={available ? `Add · ${formatPrice(product.productPrice * selected)}` : 'Sold out'}
          icon={available ? 'bag' : undefined}
          onPress={onAdd}
          disabled={!available || remaining === 0 || isStale}
          style={styles.addButton}
          testID="add-to-cart"
        />
      </View>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  panel: {
    paddingTop: t.spacing.md,
    paddingHorizontal: t.spacing.xl,
    gap: t.spacing.sm,
    backgroundColor: t.colors.surface,
    borderTopWidth: 1,
    borderTopColor: t.colors.border,
    ...t.shadows.raised,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.md },
  addButton: { flex: 1 },
  confirmation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.sm,
    padding: t.spacing.sm,
    borderRadius: t.radius.md,
    backgroundColor: t.colors.successSoft,
  },
  confirmationText: { flex: 1, color: t.colors.text, fontWeight: '600' },
  link: { fontWeight: '800' },
}));
