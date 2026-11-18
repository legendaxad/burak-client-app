import type { OrderLineInput } from '@/features/cart/utils/cart-lines';
import { ApiError, apiClient, endpoints, isApiError } from '@/services/api';

import type { Order, OrderPage, OrderStatus, OrderWithItems } from '../types';

/** The backend answers an empty page with 404 + this message (defect B10). */
const EMPTY_PAGE_MESSAGE = 'No data found!';

function assertOrder(data: unknown): Order {
  const order = data as Partial<Order> | null;
  if (!order || typeof order._id !== 'string' || typeof order.orderTotal !== 'number') {
    throw new ApiError('unknown', 'The server returned an unexpected order response.');
  }
  return order as Order;
}

export interface OrderListParams {
  page: number;
  limit: number;
  status?: OrderStatus;
}

export const orderApi = {
  /**
   * POST /order/create. Body: [{ productId, itemQuantity, itemPrice }].
   * The backend trusts `itemPrice`, so callers must price lines from fresh server data.
   */
  async createOrder(lines: readonly OrderLineInput[]): Promise<Order> {
    const { data } = await apiClient.post<unknown>(endpoints.order.create, lines);
    return assertOrder(data);
  },

  /** GET /order/all for the signed-in member. An empty page is returned as `[]`. */
  async getMyOrders({ page, limit, status }: OrderListParams, signal?: AbortSignal): Promise<OrderPage> {
    try {
      const { data } = await apiClient.get<unknown>(endpoints.order.all, {
        params: { page, limit, ...(status ? { orderStatus: status } : {}) },
        signal,
      });
      if (!Array.isArray(data)) throw new ApiError('unknown', 'The server returned an unexpected order list.');
      const items = data as OrderWithItems[];
      return { items, page, hasMore: items.length === limit };
    } catch (error) {
      if (isApiError(error) && error.status === 404 && error.serverMessage === EMPTY_PAGE_MESSAGE) {
        return { items: [], page, hasMore: false };
      }
      throw error;
    }
  },

  /**
   * POST /order/update. The backend does not validate transitions itself, so only
   * call this through the order action flow, which enforces the allowed workflow.
   */
  async updateOrderStatus(orderId: string, orderStatus: OrderStatus): Promise<Order> {
    try {
      const { data } = await apiClient.post<unknown>(endpoints.order.update, { orderId, orderStatus });
      return assertOrder(data);
    } catch (error) {
      // 304 (no body) means no order of this member matched the id.
      if (isApiError(error) && error.status === 304) {
        throw new ApiError('http', 'This order could not be updated.', { status: 404 });
      }
      throw error;
    }
  },
};
