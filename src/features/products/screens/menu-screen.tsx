import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, ScrollView, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { EmptyState, ErrorState } from '@/components/common/state-message';
import { Chip } from '@/components/inputs/chip';
import { SearchBar } from '@/components/inputs/search-bar';
import { PageHeader } from '@/components/layouts/page-header';
import { Screen } from '@/components/layouts/screen';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { getErrorMessage } from '@/services/api';
import { makeStyles, useTheme } from '@/theme';

import { CollectionFilterBar } from '../components/collection-filter-bar';
import { ProductCard, ProductCardSkeleton } from '../components/product-card';
import { findCollectionFilter, SORT_OPTIONS } from '../constants/collections';
import { useProductList } from '../hooks/use-products';
import type { Product, ProductCollection, ProductSort } from '../types';

export interface MenuScreenProps {
  initialCollection?: ProductCollection;
  initialSort?: ProductSort;
  autoFocusSearch?: boolean;
}

export function MenuScreen({ initialCollection, initialSort = 'productViews', autoFocusSearch }: MenuScreenProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  const [collection, setCollection] = useState<ProductCollection | undefined>(initialCollection);
  const [order, setOrder] = useState<ProductSort>(initialSort);
  const [searchText, setSearchText] = useState('');
  const search = useDebouncedValue(searchText.trim());

  const filters = useMemo(() => ({ order, collection, search: search || undefined }), [order, collection, search]);
  const query = useProductList(filters);
  const products = useMemo(() => query.data?.pages.flatMap((page) => page.items) ?? [], [query.data]);
  const isRefreshing = query.isRefetching && !query.isFetchingNextPage;

  const header = (
    <View style={styles.header}>
      <PageHeader title="Menu" subtitle="Everything the BURAK kitchen is serving right now." />
      <View style={styles.search}>
        <SearchBar value={searchText} onChangeText={setSearchText} autoFocus={autoFocusSearch} />
      </View>
      <CollectionFilterBar value={collection} onChange={setCollection} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sortRow}>
        <AppText variant="caption" tone="muted">
          Sort
        </AppText>
        {SORT_OPTIONS.map((option) => (
          <Chip key={option.key} label={option.label} selected={order === option.key} onPress={() => setOrder(option.key)} />
        ))}
      </ScrollView>
    </View>
  );

  const renderEmpty = () => {
    if (query.isPending) {
      return (
        <View style={styles.skeletonGrid}>
          {[0, 1, 2, 3].map((key) => (
            <View key={key} style={styles.skeletonCell}>
              <ProductCardSkeleton />
            </View>
          ))}
        </View>
      );
    }
    if (query.isError) {
      return (
        <View style={styles.message}>
          <ErrorState title="Could not load the menu" message={getErrorMessage(query.error)} onRetry={() => void query.refetch()} />
        </View>
      );
    }
    const filterLabel = findCollectionFilter(collection)?.label.toLowerCase();
    return (
      <View style={styles.message}>
        <EmptyState
          icon="search"
          title={search ? `No results for “${search}”` : 'Nothing here yet'}
          message={
            search
              ? 'Try a different name or clear the filters.'
              : filterLabel
                ? `The kitchen has no ${filterLabel} on the menu right now.`
                : 'The kitchen has not published any dishes yet.'
          }
        />
      </View>
    );
  };

  return (
    <Screen scroll={false}>
      <FlatList<Product>
        data={products}
        keyExtractor={(item) => item._id}
        numColumns={2}
        renderItem={({ item }) => (
          <View style={styles.cell}>
            <ProductCard product={item} />
          </View>
        )}
        ListHeaderComponent={header}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={
          query.isFetchingNextPage ? (
            <ActivityIndicator style={styles.footer} color={colors.primaryStrong} />
          ) : query.isFetchNextPageError ? (
            <View style={styles.message}>
              <ErrorState
                title="Could not load more"
                message={getErrorMessage(query.error)}
                onRetry={() => void query.fetchNextPage()}
              />
            </View>
          ) : undefined
        }
        columnWrapperStyle={styles.columns}
        contentContainerStyle={styles.content}
        onEndReachedThreshold={0.5}
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetchingNextPage && !query.isFetchNextPageError) void query.fetchNextPage();
        }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => void query.refetch()}
            tintColor={colors.primaryStrong}
            colors={[colors.primaryStrong]}
          />
        }
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  header: { gap: t.spacing.md, paddingBottom: t.spacing.lg },
  search: { paddingHorizontal: t.spacing.xl },
  sortRow: { gap: t.spacing.sm, paddingHorizontal: t.spacing.xl, alignItems: 'center' },
  content: { paddingBottom: t.spacing.xxxl, flexGrow: 1 },
  columns: { gap: t.spacing.md, paddingHorizontal: t.spacing.xl },
  cell: { flex: 1, maxWidth: '50%', marginBottom: t.spacing.md },
  skeletonGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: t.spacing.xl, gap: t.spacing.md },
  skeletonCell: { width: '47%' },
  message: { paddingHorizontal: t.spacing.xl },
  footer: { paddingVertical: t.spacing.xl },
}));
