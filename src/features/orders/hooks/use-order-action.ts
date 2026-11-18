import { useMutation, useQueryClient } from '@tanstack/react-query';

import { memberKeys } from '@/features/auth';

import { orderKeys } from '../query-keys';
import { orderApi } from '../services/order-api';
import type { Order, OrderStatus } from '../types';
import { canPerform, ORDER_STATUS_META, type OrderAction } from '../utils/order-status';
import { findOrderOnServer, orderNotFound } from './use-orders';

/** The order's status changed elsewhere since it was displayed. Nothing was sent. */
export class StaleOrderStatusError extends Error {
  constructor(readonly currentStatus: OrderStatus) {
    super(`This order is now “${ORDER_STATUS_META[currentStatus].label}”. The screen has been refreshed.`);
    this.name = 'StaleOrderStatusError';
  }
}

/** Orders with a status change in flight on this device. */
const inFlight = new Set<string>();

/**
 * Runs one workflow action. Because the backend accepts any status and adds a point
 * every time PROCESS is set, the app protects against duplicates itself:
 *  1. one request per order at a time (repeated taps are ignored);
 *  2. the current status is re-read from the server first, and the request is only
 *     sent when the transition is still valid.
 */
export async function performOrderAction(orderId: string, action: OrderAction): Promise<Order | null> {
  if (inFlight.has(orderId)) return null;
  inFlight.add(orderId);
  try {
    const current = await findOrderOnServer(orderId);
    if (!current) throw orderNotFound();
    if (!canPerform(current.orderStatus, action)) throw new StaleOrderStatusError(current.orderStatus);
    return await orderApi.updateOrderStatus(orderId, action.to);
  } finally {
    inFlight.delete(orderId);
  }
}

export function useOrderAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, action }: { orderId: string; action: OrderAction }) => performOrderAction(orderId, action),
    onSettled: async (_data, _error, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: orderKeys.all }),
        // Confirming an order changes the member's points (server-side).
        variables.action.to === 'PROCESS' ? queryClient.invalidateQueries({ queryKey: memberKeys.me() }) : undefined,
      ]);
    },
  });
}
