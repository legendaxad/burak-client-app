import { useLocalSearchParams } from 'expo-router';

import { OrderDetailScreen } from '@/features/orders/screens/order-detail-screen';

export default function OrderDetailRoute() {
  const { id, placed } = useLocalSearchParams<{ id: string; placed?: string }>();
  return <OrderDetailScreen key={id} id={String(id ?? '')} justPlaced={placed === '1'} />;
}
