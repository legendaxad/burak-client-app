import { router } from 'expo-router';
import { memo } from 'react';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { Skeleton } from '@/components/common/skeleton';
import { makeStyles } from '@/theme';
import { formatPrice } from '@/utils/format-price';

import { getCollectionLabel } from '../constants/collections';
import type { Product } from '../types';
import { getPortionLabel } from '../utils/product-display';
import { ProductImage } from './product-image';
import { StockBadge } from './stock-badge';

type CardLayout = 'grid' | 'carousel';

interface ProductCardProps {
  product: Product;
  layout?: CardLayout;
}

/** The single product card used by every list (home carousels and menu grid). */
export const ProductCard = memo(function ProductCard({ product, layout = 'grid' }: ProductCardProps) {
  const styles = useStyles();
  const collection = getCollectionLabel(product.productCollection);
  const price = formatPrice(product.productPrice);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${product.productName}, ${collection}, ${price}`}
      accessibilityHint="Opens product details"
      onPress={() => router.push({ pathname: '/products/[id]', params: { id: product._id } })}
      style={({ pressed }) => [styles.card, layout === 'carousel' ? styles.carousel : styles.grid, pressed && styles.pressed]}
    >
      <ProductImage
        path={product.productImages[0]}
        collection={product.productCollection}
        style={layout === 'carousel' ? styles.imageCarousel : styles.imageGrid}
      />
      <View style={styles.body}>
        <AppText variant="overline" tone="primary" numberOfLines={1}>
          {collection} · {getPortionLabel(product)}
        </AppText>
        <AppText variant="bodyStrong" numberOfLines={2} style={styles.name}>
          {product.productName}
        </AppText>
        <View style={styles.footer}>
          <AppText variant="bodyStrong">{price}</AppText>
          <StockBadge product={product} />
        </View>
      </View>
    </Pressable>
  );
});

export function ProductCardSkeleton({ layout = 'grid' }: { layout?: CardLayout }) {
  const styles = useStyles();
  return (
    <View style={[styles.card, layout === 'carousel' ? styles.carousel : styles.grid]}>
      <Skeleton height={layout === 'carousel' ? 140 : 128} radius={0} />
      <View style={styles.body}>
        <Skeleton width="45%" height={10} />
        <Skeleton width="85%" height={14} />
        <Skeleton width="35%" height={14} />
      </View>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  card: {
    backgroundColor: t.colors.surface,
    borderRadius: t.radius.lg,
    borderWidth: 1,
    borderColor: t.colors.border,
    overflow: 'hidden',
    ...t.shadows.card,
  },
  grid: { flex: 1 },
  carousel: { width: 200 },
  imageGrid: { height: 128 },
  imageCarousel: { height: 140 },
  body: { padding: t.spacing.md, gap: t.spacing.xs + 1 },
  name: { minHeight: 40 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: t.spacing.xs, flexWrap: 'wrap' },
  pressed: { opacity: 0.8 },
}));
