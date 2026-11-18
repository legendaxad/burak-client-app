import { useInfiniteQuery, useQuery, useQueryClient, type InfiniteData, type QueryClient } from '@tanstack/react-query';

import { ApiError } from '@/services/api';

import { orderKeys } from '../query-keys';
import { orderApi } from '../services/order-api';
import type { OrderPage, OrderStatus, OrderWithItems } from '../types';

export const ORDER_PAGE_SIZE = 10;
/** Page size used when searching for one order (there is no GET /order/:id). */
const SCAN_PAGE_SIZE = 50;
const MAX_SCAN_PAGES = 40;
const OBJECT_ID = /^[a-f0-9]{24}$/i;

/** Order history for the signed-in member, optionally filtered by status. */
export function useOrderList(status: OrderStatus | 'ALL') {
  return useInfiniteQuery({
    queryKey: orderKeys.list(status),
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      orderApi.getMyOrders(
        { page: pageParam, limit: ORDER_PAGE_SIZE, status: status === 'ALL' ? undefined : status },
        signal,
      ),
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
  });
}

export const orderNotFound = () => new ApiError('http', 'This order could not be found.', { status: 404 });

/**
 * Looks an order up on the server. The backend has no single-order endpoint, so this
 * pages through GET /order/all (newest updates first, so recent orders are found on
 * page 1). Only the signed-in member's orders are ever returned by the backend.
 */
export async function findOrderOnServer(id: string, signal?: AbortSignal): Promise<OrderWithItems | null> {
  if (!OBJECT_ID.test(id)) return null;
  for (let page = 1; page <= MAX_SCAN_PAGES; page++) {
    const result = await orderApi.getMyOrders({ page, limit: SCAN_PAGE_SIZE }, signal);
    const match = result.items.find((order) => order._id === id);
    if (match) return match;
    if (!result.hasMore) return null;
  }
  return null;
}

function findCachedOrder(queryClient: QueryClient, id: string): OrderWithItems | undefined {
  for (const query of queryClient.getQueryCache().findAll({ queryKey: orderKeys.lists() })) {
    const data = query.state.data as InfiniteData<OrderPage> | undefined;
    for (const page of data?.pages ?? []) {
      const hit = page.items.find((order) => order._id === id);
      if (hit) return hit;
    }
  }
  return undefined;
}

/** One order: shown from the list cache instantly, always refreshed from the server. */
export function useOrder(id: string) {
  const queryClient = useQueryClient();
  return useQuery<OrderWithItems>({
    queryKey: orderKeys.detail(id),
    queryFn: async ({ signal }) => {
      const order = await findOrderOnServer(id, signal);
      if (!order) throw orderNotFound();
      return order;
    },
    placeholderData: () => findCachedOrder(queryClient, id),
  });
}
