import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useRef } from 'react';

import {
  buildOrderPayload,
  isNotFound,
  validateCheckout,
  type CheckoutIssue,
} from '@/features/cart/utils/cart-lines';
import type { CartItem } from '@/features/cart/utils/cart-logic';
import { useCreateOrder } from '@/features/orders/hooks/use-create-order';
import type { Order } from '@/features/orders/types';
import { productDetailQuery } from '@/features/products/hooks/use-products';
import type { Product } from '@/features/products/types';
import { isApiError } from '@/services/api';
import { useCartStore } from '@/store/cart/cart-store';

/** The cart no longer matches the server (availability, stock or price). Nothing was ordered. */
export class CheckoutValidationError extends Error {
  constructor(readonly issues: CheckoutIssue[]) {
    super('Your cart changed. Please review it before ordering.');
    this.name = 'CheckoutValidationError';
  }
}

/**
 * The create-order request failed in transit: the server may or may not have created
 * the order. The customer must check order history instead of blindly retrying.
 */
export class UncertainOrderError extends Error {
  constructor() {
    super("We couldn't confirm whether your order was placed. Check My orders before trying again.");
    this.name = 'UncertainOrderError';
  }
}

/** Always hits the network (staleTime 0). 404 → null (paused or removed product). */
export async function fetchFreshProducts(
  queryClient: QueryClient,
  items: readonly CartItem[],
): Promise<Map<string, Product | null>> {
  const entries = await Promise.all(
    items.map(async (item): Promise<[string, Product | null]> => {
      try {
        return [item.productId, await queryClient.fetchQuery({ ...productDetailQuery(item.productId), staleTime: 0 })];
      } catch (error) {
        if (isNotFound(error)) return [item.productId, null];
        throw error;
      }
    }),
  );
  return new Map(entries);
}

export interface PlaceOrderInput {
  items: CartItem[];
  /** Unit prices shown to the customer when they pressed "Place order". */
  reviewedPrices: Record<string, number>;
}

export function usePlaceOrder() {
  const queryClient = useQueryClient();
  const createOrder = useCreateOrder();
  const removeMany = useCartStore((state) => state.removeMany);
  const inFlight = useRef(false);

  const mutation = useMutation<Order, Error, PlaceOrderInput>({
    mutationFn: async ({ items, reviewedPrices }) => {
      if (items.length === 0) throw new CheckoutValidationError([]);

      const fresh = await fetchFreshProducts(queryClient, items);
      const issues = validateCheckout(items, fresh, reviewedPrices);
      if (issues.length > 0) throw new CheckoutValidationError(issues);

      let order: Order;
      try {
        order = await createOrder.mutateAsync(buildOrderPayload(items, fresh));
      } catch (error) {
        if (isApiError(error) && (error.kind === 'network' || error.kind === 'timeout')) {
          throw new UncertainOrderError();
        }
        throw error;
      }

      // Only after the server confirmed the order.
      removeMany(items.map((item) => item.productId));
      return order;
    },
  });

  /** Ignores repeated taps while an order is being placed. */
  const placeOrder = (input: PlaceOrderInput, options?: { onSuccess?: (order: Order) => void }) => {
    if (inFlight.current) return;
    inFlight.current = true;
    mutation.mutate(input, {
      onSuccess: (order) => options?.onSuccess?.(order),
      onSettled: () => {
        inFlight.current = false;
      },
    });
  };

  return { ...mutation, placeOrder };
}
