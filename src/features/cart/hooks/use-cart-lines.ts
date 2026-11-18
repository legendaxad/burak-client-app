import { useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';

import { productDetailQuery } from '@/features/products/hooks/use-products';
import { useCartStore } from '@/store/cart/cart-store';

import { buildCartLine, summarizeCart, type CartLine, type CartSummary } from '../utils/cart-lines';

const CART_PRODUCT_STALE_MS = 30_000;

export interface CartView {
  lines: CartLine[];
  summary: CartSummary;
  hasHydrated: boolean;
  isRefetching: boolean;
  refetch: () => Promise<void>;
}

/** Cart selections joined with live product data (one cached query per product). */
export function useCartLines(): CartView {
  const items = useCartStore((state) => state.items);
  const hasHydrated = useCartStore((state) => state.hasHydrated);

  const results = useQueries({
    queries: items.map((item) => ({ ...productDetailQuery(item.productId), staleTime: CART_PRODUCT_STALE_MS })),
  });

  const lines = useMemo(
    () =>
      items.map((item, index) => {
        const result = results[index];
        return buildCartLine(item, result && { data: result.data, error: result.error, isPending: result.isPending });
      }),
    [items, results],
  );

  return {
    lines,
    summary: summarizeCart(lines),
    hasHydrated,
    isRefetching: results.some((result) => result.isRefetching),
    refetch: async () => {
      await Promise.all(results.map((result) => result.refetch()));
    },
  };
}
