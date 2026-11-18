import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { OrderLineInput } from '@/features/cart/utils/cart-lines';

import { orderKeys } from '../query-keys';
import { orderApi } from '../services/order-api';

/** Creates an order and refreshes order history. Public hook used by checkout. */
export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (lines: readonly OrderLineInput[]) => orderApi.createOrder(lines),
    onSettled: () => queryClient.invalidateQueries({ queryKey: orderKeys.all }),
  });
}
