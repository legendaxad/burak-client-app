import { router } from 'expo-router';
import { useState } from 'react';
import { RefreshControl, ScrollView, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconButton } from '@/components/buttons/icon-button';
import { AppText } from '@/components/common/app-text';
import { Icon } from '@/components/common/icon';
import { Skeleton } from '@/components/common/skeleton';
import { ErrorState } from '@/components/common/state-message';
import { getErrorMessage, isApiError } from '@/services/api';
import { makeStyles, useTheme } from '@/theme';
import { formatPrice } from '@/utils/format-price';

import { ProductImage } from '../components/product-image';
import { StockBadge } from '../components/stock-badge';
import { getCollectionLabel } from '../constants/collections';
import { useProduct } from '../hooks/use-products';
import type { Product } from '../types';
import { getPortionLabel, getStockState } from '../utils/product-display';

const MAX_IMAGE_HEIGHT = 420;

export function ProductDetailScreen({ id }: { id: string }) {
  const styles = useStyles();
  const query = useProduct(id);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/menu'));

  return (
    <View style={styles.root}>
      {query.data ? (
        <ProductDetailContent product={query.data} refreshing={query.isRefetching} onRefresh={() => void query.refetch()} />
      ) : query.isError ? (
        <SafeAreaView style={styles.centered}>
          <ErrorState
            title={isApiError(query.error) && query.error.status === 404 ? 'Product unavailable' : 'Could not load this product'}
            message={
              isApiError(query.error) && query.error.status === 404
                ? 'It may have been removed from the menu or paused by the kitchen.'
                : getErrorMessage(query.error)
            }
            onRetry={() => void query.refetch()}
          />
        </SafeAreaView>
      ) : (
        <DetailSkeleton />
      )}
      <SafeAreaView edges={['top']} style={styles.backBar} pointerEvents="box-none">
        <IconButton icon="back" tone="overlay" accessibilityLabel="Go back" onPress={goBack} />
      </SafeAreaView>
    </View>
  );
}

function ProductDetailContent({
  product,
  refreshing,
  onRefresh,
}: {
  product: Product;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const imageHeight = Math.min(width * 0.85, MAX_IMAGE_HEIGHT);
  const images = product.productImages.length ? product.productImages : [undefined];
  const [activeImage, setActiveImage] = useState(0);
  const stock = getStockState(product);

  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primaryStrong} />}
    >
      <View>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEnabled={images.length > 1}
          onMomentumScrollEnd={(event) => setActiveImage(Math.round(event.nativeEvent.contentOffset.x / width))}
        >
          {images.map((path, index) => (
            <ProductImage
              key={path ?? `placeholder-${index}`}
              path={path}
              collection={product.productCollection}
              showCaption
              style={{ width, height: imageHeight }}
            />
          ))}
        </ScrollView>
        {images.length > 1 ? (
          <View style={styles.dots} accessibilityLabel={`Photo ${activeImage + 1} of ${images.length}`}>
            {images.map((_, index) => (
              <View key={index} style={[styles.dot, index === activeImage && styles.dotActive]} />
            ))}
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <View style={styles.width}>
          <AppText variant="overline" tone="primary">
            {getCollectionLabel(product.productCollection)} · {getPortionLabel(product)}
          </AppText>
          <AppText variant="title" accessibilityRole="header" style={styles.title}>
            {product.productName}
          </AppText>
          <View style={styles.priceRow}>
            <AppText variant="heading">{formatPrice(product.productPrice)}</AppText>
            <StockBadge product={product} />
          </View>

          <View style={styles.facts}>
            <Fact
              icon="check"
              label={stock.kind === 'soldOut' ? 'Currently sold out' : `${product.productLeftCount} available`}
              tone={stock.kind === 'soldOut' ? 'danger' : 'success'}
            />
            <Fact icon="views" label={`${product.productViews} ${product.productViews === 1 ? 'view' : 'views'}`} />
          </View>

          <View style={styles.section}>
            <AppText variant="subheading">About this item</AppText>
            <AppText tone={product.productDesc ? 'default' : 'muted'}>
              {product.productDesc?.trim() || 'The kitchen has not added a description yet.'}
            </AppText>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

function Fact({ icon, label, tone }: { icon: 'check' | 'views'; label: string; tone?: 'success' | 'danger' }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const color = tone === 'danger' ? colors.danger : tone === 'success' ? colors.success : colors.textMuted;
  return (
    <View style={styles.fact}>
      <Icon name={icon} size={15} color={color} />
      <AppText variant="caption" style={{ color }}>
        {label}
      </AppText>
    </View>
  );
}

function DetailSkeleton() {
  const styles = useStyles();
  const { width } = useWindowDimensions();
  return (
    <View accessibilityLabel="Loading product">
      <Skeleton height={Math.min(width * 0.85, MAX_IMAGE_HEIGHT)} radius={0} />
      <View style={[styles.body, styles.skeletonBody]}>
        <Skeleton width="30%" height={10} />
        <Skeleton width="70%" height={26} />
        <Skeleton width="25%" height={20} />
        <Skeleton height={60} />
      </View>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  root: { flex: 1, backgroundColor: t.colors.background },
  centered: { flex: 1, justifyContent: 'center', padding: t.spacing.xl },
  backBar: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: t.spacing.lg, paddingTop: t.spacing.sm },
  scroll: { paddingBottom: t.spacing.huge },
  dots: { position: 'absolute', bottom: t.spacing.md, alignSelf: 'center', flexDirection: 'row', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.55)' },
  dotActive: { backgroundColor: t.colors.primary },
  body: {
    marginTop: -t.radius.xl,
    borderTopLeftRadius: t.radius.xl,
    borderTopRightRadius: t.radius.xl,
    backgroundColor: t.colors.background,
    paddingHorizontal: t.spacing.xl,
    paddingTop: t.spacing.xxl,
  },
  width: { width: '100%', maxWidth: t.sizes.contentMaxWidth, alignSelf: 'center', gap: t.spacing.sm },
  skeletonBody: { gap: t.spacing.md },
  title: { marginTop: t.spacing.xs },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.md },
  facts: { flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.lg, marginTop: t.spacing.sm },
  fact: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.xs },
  section: {
    marginTop: t.spacing.lg,
    padding: t.spacing.lg,
    gap: t.spacing.sm,
    backgroundColor: t.colors.surface,
    borderRadius: t.radius.lg,
    borderWidth: 1,
    borderColor: t.colors.border,
  },
}));
