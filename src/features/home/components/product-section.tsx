import { router } from 'expo-router';
import { FlatList, Pressable, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { EmptyState, ErrorState } from '@/components/common/state-message';
import { SectionHeader } from '@/components/layouts/page-header';
import { ProductCard, ProductCardSkeleton } from '@/features/products/components/product-card';
import { useProductSection } from '@/features/products/hooks/use-products';
import type { ProductSort } from '@/features/products/types';
import { getErrorMessage } from '@/services/api';
import { makeStyles } from '@/theme';

interface ProductSectionProps {
  title: string;
  order: ProductSort;
}

/** A horizontal carousel backed by a real sort order of GET /product/all. */
export function ProductSection({ title, order }: ProductSectionProps) {
  const styles = useStyles();
  const query = useProductSection(order);

  return (
    <View style={styles.section}>
      <View style={styles.padded}>
        <SectionHeader
          title={title}
          action={
            <Pressable
              accessibilityRole="link"
              accessibilityLabel={`See all, ${title}`}
              hitSlop={12}
              onPress={() => router.push({ pathname: '/menu', params: { sort: order } })}
            >
              <AppText variant="caption" tone="primary" style={styles.link}>
                See all
              </AppText>
            </Pressable>
          }
        />
      </View>

      {query.isPending ? (
        <View style={styles.skeletonRow}>
          <ProductCardSkeleton layout="carousel" />
          <ProductCardSkeleton layout="carousel" />
        </View>
      ) : query.isError ? (
        <View style={styles.padded}>
          <ErrorState message={getErrorMessage(query.error)} onRetry={() => void query.refetch()} />
        </View>
      ) : query.data.length === 0 ? (
        <View style={styles.padded}>
          <EmptyState icon="menu" title="No dishes yet" message="The kitchen has not published any dishes." />
        </View>
      ) : (
        <FlatList
          horizontal
          data={query.data}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <ProductCard product={item} layout="carousel" />}
          contentContainerStyle={styles.list}
          showsHorizontalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  section: { gap: t.spacing.md },
  padded: { paddingHorizontal: t.spacing.xl },
  link: { fontWeight: '700' },
  list: { gap: t.spacing.md, paddingHorizontal: t.spacing.xl, paddingBottom: t.spacing.xs },
  skeletonRow: { flexDirection: 'row', gap: t.spacing.md, paddingHorizontal: t.spacing.xl },
}));
