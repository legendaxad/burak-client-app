import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, ScrollView, View } from 'react-native';

import { Button } from '@/components/buttons/button';
import { EmptyState, ErrorState } from '@/components/common/state-message';
import { Chip } from '@/components/inputs/chip';
import { PageHeader } from '@/components/layouts/page-header';
import { Screen } from '@/components/layouts/screen';
import { getErrorMessage } from '@/services/api';
import { makeStyles, useTheme } from '@/theme';

import { OrderCard, OrderCardSkeleton } from '../components/order-card';
import { useOrderList } from '../hooks/use-orders';
import type { OrderStatus, OrderWithItems } from '../types';
import { ORDER_FILTERS } from '../utils/order-status';

type Filter = OrderStatus | 'ALL';

const emptyCopy: Record<Filter, { title: string; message: string }> = {
  ALL: { title: 'No orders yet', message: 'Orders you place will appear here.' },
  PAUSE: { title: 'Nothing to confirm', message: 'Orders waiting for your confirmation appear here.' },
  PROCESS: { title: 'Nothing in progress', message: 'Confirmed orders appear here while the kitchen works on them.' },
  FINISH: { title: 'No completed orders', message: 'Orders you mark as received appear here.' },
  DELETED: { title: 'No cancelled orders', message: 'Orders you cancel appear here.' },
};

export function OrdersScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const [filter, setFilter] = useState<Filter>('ALL');
  const query = useOrderList(filter);
  const orders = useMemo(() => query.data?.pages.flatMap((page) => page.items) ?? [], [query.data]);

  const header = (
    <View style={styles.header}>
      <PageHeader title="My orders" subtitle="Track and manage the orders you placed." />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {ORDER_FILTERS.map((option) => (
          <Chip key={option.key} label={option.label} selected={filter === option.key} onPress={() => setFilter(option.key)} />
        ))}
      </ScrollView>
    </View>
  );

  const renderEmpty = () => {
    if (query.isPending) {
      return (
        <View style={styles.stack}>
          <OrderCardSkeleton />
          <OrderCardSkeleton />
          <OrderCardSkeleton />
        </View>
      );
    }
    if (query.isError) {
      return (
        <View style={styles.padded}>
          <ErrorState title="Could not load your orders" message={getErrorMessage(query.error)} onRetry={() => void query.refetch()} />
        </View>
      );
    }
    return (
      <View style={styles.padded}>
        <EmptyState
          icon="receipt"
          title={emptyCopy[filter].title}
          message={emptyCopy[filter].message}
          action={filter === 'ALL' ? <Button title="Browse the menu" onPress={() => router.navigate('/menu')} /> : undefined}
        />
      </View>
    );
  };

  return (
    <Screen scroll={false}>
      <FlatList<OrderWithItems>
        data={orders}
        keyExtractor={(order) => order._id}
        renderItem={({ item }) => (
          <View style={styles.padded}>
            <OrderCard order={item} />
          </View>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={header}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={
          query.isFetchingNextPage ? (
            <ActivityIndicator style={styles.footer} color={colors.primaryStrong} />
          ) : query.isFetchNextPageError ? (
            <View style={styles.padded}>
              <ErrorState title="Could not load more" message={getErrorMessage(query.error)} onRetry={() => void query.fetchNextPage()} />
            </View>
          ) : undefined
        }
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetchingNextPage && !query.isFetchNextPageError) void query.fetchNextPage();
        }}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching && !query.isFetchingNextPage}
            onRefresh={() => void query.refetch()}
            tintColor={colors.primaryStrong}
            colors={[colors.primaryStrong]}
          />
        }
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  header: { gap: t.spacing.xs, paddingBottom: t.spacing.lg },
  filters: { gap: t.spacing.sm, paddingHorizontal: t.spacing.xl },
  padded: { paddingHorizontal: t.spacing.xl },
  stack: { paddingHorizontal: t.spacing.xl, gap: t.spacing.md },
  separator: { height: t.spacing.md },
  content: { paddingBottom: t.spacing.xxxl, flexGrow: 1 },
  footer: { paddingVertical: t.spacing.xl },
}));
