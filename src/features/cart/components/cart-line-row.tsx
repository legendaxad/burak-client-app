import { router } from 'expo-router';
import { memo } from 'react';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { Icon } from '@/components/common/icon';
import { Skeleton } from '@/components/common/skeleton';
import { QuantityStepper } from '@/components/inputs/quantity-stepper';
import { ProductImage } from '@/features/products/components/product-image';
import { useCartStore } from '@/store/cart/cart-store';
import { makeStyles, useTheme } from '@/theme';
import { formatPrice } from '@/utils/format-price';

import type { CartLine } from '../utils/cart-lines';

interface CartLineRowProps {
  line: CartLine;
  onRetry: () => void;
}

export const CartLineRow = memo(function CartLineRow({ line, onRetry }: CartLineRowProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  const setQuantity = useCartStore((state) => state.setQuantity);
  const remove = useCartStore((state) => state.remove);
  const { product } = line;

  if (line.state === 'loading') return <CartLineSkeleton />;

  const name = product?.productName ?? 'Unavailable item';
  const stock = product?.productLeftCount;

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open ${name}`}
        disabled={!product}
        onPress={() => router.push({ pathname: '/products/[id]', params: { id: line.productId } })}
      >
        <ProductImage
          path={product?.productImages[0]}
          collection={product?.productCollection ?? 'OTHER'}
          style={styles.image}
        />
      </Pressable>

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <AppText variant="bodyStrong" numberOfLines={2} style={styles.name}>
            {name}
          </AppText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Remove ${name} from cart`}
            hitSlop={10}
            onPress={() => remove(line.productId)}
            style={styles.remove}
          >
            <Icon name="trash" size={18} color={colors.textMuted} />
          </Pressable>
        </View>

        {product && line.state !== 'unavailable' ? (
          <AppText variant="caption" tone="muted">
            {formatPrice(product.productPrice)} each
          </AppText>
        ) : null}

        {line.state === 'unavailable' ? (
          <AppText variant="caption" tone="danger">
            No longer available. Remove it to continue.
          </AppText>
        ) : line.state === 'error' ? (
          <Pressable accessibilityRole="button" onPress={onRetry} hitSlop={8}>
            <AppText variant="caption" tone="danger">
              Could not load this item. Tap to retry.
            </AppText>
          </Pressable>
        ) : line.state === 'insufficientStock' ? (
          <Pressable
            accessibilityRole="button"
            accessibilityHint={`Sets the quantity to ${line.maxQuantity}`}
            onPress={() => setQuantity(line.productId, line.maxQuantity, stock)}
            hitSlop={8}
          >
            <AppText variant="caption" tone="danger">
              Only {line.maxQuantity} left. Tap to update quantity.
            </AppText>
          </Pressable>
        ) : null}

        {line.state === 'ok' || line.state === 'insufficientStock' ? (
          <View style={styles.footer}>
            <QuantityStepper
              compact
              value={line.quantity}
              max={Math.max(line.maxQuantity, line.quantity)}
              onChange={(next) => setQuantity(line.productId, next, stock)}
              label={name}
            />
            <AppText variant="bodyStrong">{line.state === 'ok' ? formatPrice(line.lineTotal) : '—'}</AppText>
          </View>
        ) : null}
      </View>
    </View>
  );
});

export function CartLineSkeleton() {
  const styles = useStyles();
  return (
    <View style={styles.row} accessibilityLabel="Loading cart item">
      <Skeleton width={76} height={76} radius={14} />
      <View style={[styles.body, styles.skeletonBody]}>
        <Skeleton width="70%" height={14} />
        <Skeleton width="35%" height={12} />
        <Skeleton width={110} height={32} radius={16} />
      </View>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  row: {
    flexDirection: 'row',
    gap: t.spacing.md,
    padding: t.spacing.md,
    backgroundColor: t.colors.surface,
    borderRadius: t.radius.lg,
    borderWidth: 1,
    borderColor: t.colors.border,
  },
  image: { width: 76, height: 76, borderRadius: t.radius.md },
  body: { flex: 1, gap: t.spacing.xs },
  skeletonBody: { gap: t.spacing.sm },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: t.spacing.sm },
  name: { flex: 1 },
  remove: { padding: t.spacing.xxs },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: t.spacing.xs },
}));
