import { router } from 'expo-router';
import { Alert, FlatList, RefreshControl, View } from 'react-native';

import { Button } from '@/components/buttons/button';
import { AppText } from '@/components/common/app-text';
import { EmptyState, LoadingView } from '@/components/common/state-message';
import { PageHeader } from '@/components/layouts/page-header';
import { Screen } from '@/components/layouts/screen';
import { useCartStore } from '@/store/cart/cart-store';
import { makeStyles, useTheme } from '@/theme';
import { formatPrice } from '@/utils/format-price';

import { CartLineRow } from '../components/cart-line-row';
import { useCartLines } from '../hooks/use-cart-lines';
import type { CartLine } from '../utils/cart-lines';

export function CartScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { lines, summary, hasHydrated, isRefetching, refetch } = useCartLines();
  const clear = useCartStore((state) => state.clear);

  if (!hasHydrated) {
    return (
      <Screen>
        <PageHeader title="Cart" />
        <LoadingView message="Loading your cart…" />
      </Screen>
    );
  }

  if (lines.length === 0) {
    return (
      <Screen>
        <PageHeader title="Cart" />
        <View style={styles.padded}>
          <EmptyState
            icon="bag"
            title="Your cart is empty"
            message="Add dishes from the menu and they will appear here."
            action={<Button title="Browse the menu" icon="menu" onPress={() => router.navigate('/menu')} />}
          />
        </View>
      </Screen>
    );
  }

  const confirmClear = () =>
    Alert.alert('Empty your cart?', 'All items will be removed.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Empty cart', style: 'destructive', onPress: clear },
    ]);

  const blockingMessage = summary.isLoading
    ? 'Checking prices and availability…'
    : summary.issueCount > 0
      ? 'Resolve the highlighted items to continue.'
      : null;

  return (
    <Screen scroll={false}>
      <FlatList<CartLine>
        data={lines}
        keyExtractor={(line) => line.productId}
        renderItem={({ item }) => (
          <View style={styles.padded}>
            <CartLineRow line={item} onRetry={() => void refetch()} />
          </View>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={
          <PageHeader
            title="Cart"
            subtitle={`${summary.itemCount} ${summary.itemCount === 1 ? 'item' : 'items'} · prices are live from the kitchen`}
            action={<Button title="Empty" variant="ghost" icon="trash" onPress={confirmClear} />}
          />
        }
        ListFooterComponent={
          <Button
            title="Continue shopping"
            variant="ghost"
            icon="menu"
            onPress={() => router.navigate('/menu')}
            style={styles.continue}
          />
        }
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => void refetch()}
            tintColor={colors.primaryStrong}
            colors={[colors.primaryStrong]}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.summary}>
        <View style={styles.summaryRow}>
          <AppText tone="muted">Subtotal</AppText>
          <AppText variant="heading">{summary.isLoading ? '—' : formatPrice(summary.subtotal)}</AppText>
        </View>
        {blockingMessage ? (
          <AppText variant="caption" tone={summary.issueCount ? 'danger' : 'muted'}>
            {blockingMessage}
          </AppText>
        ) : null}
        <Button
          title="Go to checkout"
          icon="next"
          fullWidth
          disabled={!summary.canCheckout}
          onPress={() => router.push('/checkout')}
          testID="go-to-checkout"
        />
      </View>
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  padded: { paddingHorizontal: t.spacing.xl },
  list: { paddingBottom: t.spacing.xl },
  separator: { height: t.spacing.md },
  continue: { marginTop: t.spacing.md, alignSelf: 'center' },
  summary: {
    paddingHorizontal: t.spacing.xl,
    paddingTop: t.spacing.md,
    paddingBottom: t.spacing.md,
    gap: t.spacing.sm,
    backgroundColor: t.colors.surface,
    borderTopWidth: 1,
    borderTopColor: t.colors.border,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
}));
