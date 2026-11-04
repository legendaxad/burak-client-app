import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppScreen, EmptyState, LoadingPanel, OrderCard, PageHeader, PrimaryButton } from '@/components/app-ui';
import { useAppData } from '@/context/app-context';
import { colors, radius, spacing } from '@/theme/colors';
import type { OrderStatus } from '@/types/models';

type OrderFilter = 'Active' | 'Past';
const activeStatuses: OrderStatus[] = ['Pending', 'Preparing', 'Ready'];

export default function OrdersScreen() {
  const { ready, orders } = useAppData();
  const [filter, setFilter] = useState<OrderFilter>('Active');
  const visibleOrders = useMemo(() => orders
    .filter((order) => filter === 'Active' ? activeStatuses.includes(order.status) : !activeStatuses.includes(order.status))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [filter, orders]);

  return (
    <AppScreen contentStyle={styles.screen}>
      <PageHeader title="Your orders" subtitle="Every good meal, all in one place." />
      <View style={styles.content}>
        <View style={styles.filterRow}>
          {(['Active', 'Past'] as const).map((option) => (
            <Pressable key={option} accessibilityRole="tab" accessibilityState={{ selected: filter === option }} onPress={() => setFilter(option)} style={[styles.filterButton, filter === option && styles.filterSelected]}>
              <Text style={[styles.filterText, filter === option && styles.filterTextSelected]}>{option}</Text>
              <Text style={[styles.filterCount, filter === option && styles.filterTextSelected]}>{orders.filter((order) => option === 'Active' ? activeStatuses.includes(order.status) : !activeStatuses.includes(order.status)).length}</Text>
            </Pressable>
          ))}
        </View>
        {!ready ? <LoadingPanel message="Loading your orders…" /> : visibleOrders.length ? visibleOrders.map((order) => <OrderCard key={order.id} order={order} onPress={() => router.push({ pathname: '/orders/[id]', params: { id: order.id } })} />) : (
          <EmptyState icon="receipt" title={filter === 'Active' ? 'No active orders' : 'No past orders yet'} message={filter === 'Active' ? 'Your next BURAK favorite will show up here.' : 'Once you complete an order, you can find it here.'} action={<PrimaryButton title="Explore the menu" onPress={() => router.navigate('/menu')} icon="menu" />} />
        )}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingBottom: 34 },
  content: { paddingHorizontal: spacing.xl, gap: 12 },
  filterRow: { minHeight: 43, padding: 4, borderRadius: radius.md, backgroundColor: '#EEEAE3', flexDirection: 'row', gap: 4, marginBottom: 2 },
  filterButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: 11 },
  filterSelected: { backgroundColor: colors.surface, elevation: 1 },
  filterText: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  filterTextSelected: { color: colors.text },
  filterCount: { color: colors.muted, fontSize: 10, fontWeight: '700' },
});
