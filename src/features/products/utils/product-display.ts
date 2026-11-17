import type { Product, ProductSize } from '../types';

const sizeLabels: Record<ProductSize, string> = {
  SMALL: 'Small',
  NORMAL: 'Regular',
  LARGE: 'Large',
  SET: 'Set',
};

/** "1.5 L" for drinks, the portion size for everything else. */
export function getPortionLabel(product: Pick<Product, 'productCollection' | 'productSize' | 'productVolume'>): string {
  if (product.productCollection === 'DRINK' && Number.isFinite(product.productVolume)) {
    return `${product.productVolume} L`;
  }
  return sizeLabels[product.productSize] ?? product.productSize;
}

export type StockState = { kind: 'soldOut' } | { kind: 'low'; left: number } | { kind: 'available' };

export const LOW_STOCK_THRESHOLD = 5;

export function getStockState(product: Pick<Product, 'productLeftCount'>): StockState {
  const left = product.productLeftCount;
  if (!Number.isFinite(left) || left <= 0) return { kind: 'soldOut' };
  if (left <= LOW_STOCK_THRESHOLD) return { kind: 'low', left };
  return { kind: 'available' };
}
