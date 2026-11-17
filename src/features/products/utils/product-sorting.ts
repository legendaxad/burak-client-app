import { parseBackendDate } from '@/utils/backend-date';

import type { Product, ProductSort } from '../types';

/** Same direction the backend applies: price ascending, everything else descending. */
export function compareProducts(order: ProductSort) {
  return (a: Product, b: Product): number => {
    switch (order) {
      case 'productPrice':
        return a.productPrice - b.productPrice;
      case 'productViews':
        return b.productViews - a.productViews;
      case 'createdAt':
        return (parseBackendDate(b.createdAt)?.getTime() ?? 0) - (parseBackendDate(a.createdAt)?.getTime() ?? 0);
    }
  };
}

/** Merges pages fetched for several backend values of one filter, without duplicates. */
export function mergeProductPages(pages: Product[][], order: ProductSort): Product[] {
  const byId = new Map<string, Product>();
  for (const page of pages) {
    for (const product of page) byId.set(product._id, product);
  }
  return [...byId.values()].sort(compareProducts(order));
}
