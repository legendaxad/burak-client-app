import type { Product } from '@/features/products/types';

/** Test-only product builder with realistic backend field values. */
export function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    _id: '6aedacf4e41718924919d190',
    productStatus: 'PROCESS',
    productCollection: 'DISH',
    productName: 'Kebab',
    productPrice: 12000,
    productLeftCount: 10,
    productSize: 'NORMAL',
    productVolume: 1,
    productImages: [],
    productViews: 0,
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-01T00:00:00.000Z',
    ...overrides,
  };
}
