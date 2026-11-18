import type { Product } from '@/features/products/types';
import { isApiError } from '@/services/api';

import { maxQuantityFor, type CartItem } from './cart-logic';

/**
 * Joins cart selections with LIVE server product data and derives what can be
 * displayed and ordered. Nothing here trusts a stored price.
 */

export type CartLineState = 'loading' | 'ok' | 'unavailable' | 'insufficientStock' | 'error';

export interface ProductLookup {
  data?: Product;
  error?: unknown;
  isPending: boolean;
}

export interface CartLine {
  productId: string;
  quantity: number;
  product?: Product;
  state: CartLineState;
  /** Highest quantity that can currently be ordered (0 when unavailable). */
  maxQuantity: number;
  /** Current server price × quantity. 0 unless the line is orderable. */
  lineTotal: number;
}

export function isNotFound(error: unknown): boolean {
  return isApiError(error) && error.status === 404;
}

function isOrderable(product: Product): boolean {
  return product.productStatus === 'PROCESS' && product.productLeftCount > 0;
}

export function buildCartLine(item: CartItem, lookup: ProductLookup | undefined): CartLine {
  const base = { productId: item.productId, quantity: item.quantity, maxQuantity: 0, lineTotal: 0 };
  const product = lookup?.data;

  if (!product) {
    if (lookup?.error) return { ...base, state: isNotFound(lookup.error) ? 'unavailable' : 'error' };
    return { ...base, state: 'loading' };
  }
  // GET /product/:id answers 404 for paused/removed products, even if older data is cached.
  if (lookup?.error && isNotFound(lookup.error)) return { ...base, product, state: 'unavailable' };
  if (!isOrderable(product)) return { ...base, product, state: 'unavailable' };

  const maxQuantity = maxQuantityFor(product.productLeftCount);
  if (item.quantity > maxQuantity) return { ...base, product, maxQuantity, state: 'insufficientStock' };
  return { ...base, product, maxQuantity, state: 'ok', lineTotal: product.productPrice * item.quantity };
}

export interface CartSummary {
  itemCount: number;
  subtotal: number;
  /** Lines that block checkout (unavailable, insufficient stock, failed to load). */
  issueCount: number;
  isLoading: boolean;
  canCheckout: boolean;
}

export function summarizeCart(lines: readonly CartLine[]): CartSummary {
  const isLoading = lines.some((line) => line.state === 'loading');
  const issueCount = lines.filter((line) => line.state !== 'ok' && line.state !== 'loading').length;
  return {
    itemCount: lines.reduce((sum, line) => sum + line.quantity, 0),
    subtotal: lines.reduce((sum, line) => sum + line.lineTotal, 0),
    issueCount,
    isLoading,
    canCheckout: lines.length > 0 && !isLoading && issueCount === 0,
  };
}

/**
 * Mirrors the backend rule in Order.service (`amount < 100 ? 5 : 0`) for display only.
 * The authoritative delivery fee is `orderDelivery` in the server's response.
 */
export const ESTIMATED_DELIVERY_FEE = 5;
export const FREE_DELIVERY_THRESHOLD = 100;

export function estimateDelivery(subtotal: number): number {
  return subtotal > 0 && subtotal < FREE_DELIVERY_THRESHOLD ? ESTIMATED_DELIVERY_FEE : 0;
}

export type CheckoutIssue =
  | { kind: 'unavailable'; productId: string; name?: string }
  | { kind: 'insufficientStock'; productId: string; name: string; available: number; requested: number }
  | { kind: 'priceChanged'; productId: string; name: string; previousPrice: number; currentPrice: number };

/**
 * Final pre-submit validation against freshly fetched products (null = 404).
 * `reviewedPrices` are the prices the customer saw on the checkout screen.
 */
export function validateCheckout(
  items: readonly CartItem[],
  fresh: ReadonlyMap<string, Product | null>,
  reviewedPrices: Readonly<Record<string, number>> = {},
): CheckoutIssue[] {
  const issues: CheckoutIssue[] = [];
  for (const item of items) {
    const product = fresh.get(item.productId);
    if (!product || !isOrderable(product)) {
      issues.push({ kind: 'unavailable', productId: item.productId, name: product?.productName });
      continue;
    }
    if (item.quantity > product.productLeftCount) {
      issues.push({
        kind: 'insufficientStock',
        productId: item.productId,
        name: product.productName,
        available: product.productLeftCount,
        requested: item.quantity,
      });
    }
    const seen = reviewedPrices[item.productId];
    if (seen !== undefined && seen !== product.productPrice) {
      issues.push({
        kind: 'priceChanged',
        productId: item.productId,
        name: product.productName,
        previousPrice: seen,
        currentPrice: product.productPrice,
      });
    }
  }
  return issues;
}

/** Request body for POST /order/create, priced from fresh server data only. */
export interface OrderLineInput {
  productId: string;
  itemQuantity: number;
  itemPrice: number;
}

export function buildOrderPayload(items: readonly CartItem[], fresh: ReadonlyMap<string, Product | null>): OrderLineInput[] {
  return items.map((item) => {
    const product = fresh.get(item.productId);
    if (!product) throw new Error(`Missing fresh data for product ${item.productId}`);
    return { productId: item.productId, itemQuantity: item.quantity, itemPrice: product.productPrice };
  });
}
