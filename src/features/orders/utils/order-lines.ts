import type { Product } from '@/features/products/types';

import type { OrderWithItems } from '../types';

export interface OrderLine {
  key: string;
  productId: string;
  /** Null when the product no longer exists in the database. */
  product: Product | null;
  name: string;
  quantity: number;
  /** Unit price recorded on the order item (what the customer paid), not today's price. */
  unitPrice: number;
  lineTotal: number;
}

/** Joins orderItems with productData. Products deleted since ordering are kept as "unavailable". */
export function buildOrderLines(order: Pick<OrderWithItems, 'orderItems' | 'productData'>): OrderLine[] {
  const products = new Map((order.productData ?? []).map((product) => [String(product._id), product]));
  return (order.orderItems ?? []).map((item) => {
    const product = products.get(String(item.productId)) ?? null;
    return {
      key: String(item._id),
      productId: String(item.productId),
      product,
      name: product?.productName ?? 'Product no longer on the menu',
      quantity: item.itemQuantity,
      unitPrice: item.itemPrice,
      lineTotal: item.itemPrice * item.itemQuantity,
    };
  });
}

export function itemsSubtotal(lines: readonly OrderLine[]): number {
  return lines.reduce((sum, line) => sum + line.lineTotal, 0);
}

export function summarizeOrderItems(lines: readonly OrderLine[], max = 2): string {
  if (lines.length === 0) return 'No items';
  const shown = lines.slice(0, max).map((line) => `${line.quantity} × ${line.name}`);
  const extra = lines.length - max;
  return extra > 0 ? `${shown.join(' · ')} +${extra} more` : shown.join(' · ');
}
