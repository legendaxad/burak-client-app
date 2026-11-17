import { apiClient } from '@/services/api';

import { getCollectionIcon, getCollectionLabel } from '../constants/collections';
import { productApi } from '../services/product-api';
import type { Product } from '../types';
import { getPortionLabel, getStockState } from '../utils/product-display';
import { mergeProductPages } from '../utils/product-sorting';

function product(overrides: Partial<Product>): Product {
  return {
    _id: 'p0',
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

describe('productApi.getProducts', () => {
  afterEach(() => jest.restoreAllMocks());

  it('always sends page, limit and order (missing ones make the backend 500)', async () => {
    const get = jest.spyOn(apiClient, 'get').mockResolvedValue({ data: [] });
    await productApi.getProducts({ page: 2, limit: 12, order: 'productViews' });
    expect(get).toHaveBeenCalledWith('/product/all', {
      params: { page: 2, limit: 12, order: 'productViews' },
      signal: undefined,
    });
  });

  it('escapes regex characters in search terms', async () => {
    const get = jest.spyOn(apiClient, 'get').mockResolvedValue({ data: [] });
    await productApi.searchProducts('  (latte)  ', { page: 1, limit: 12, order: 'createdAt' });
    expect(get.mock.calls[0][1]?.params).toMatchObject({ search: '\\(latte\\)' });
  });

  it('omits an empty search', async () => {
    const get = jest.spyOn(apiClient, 'get').mockResolvedValue({ data: [] });
    await productApi.getProducts({ page: 1, limit: 12, order: 'createdAt', search: '   ' });
    expect(get.mock.calls[0][1]?.params).not.toHaveProperty('search');
  });

  it('filters by the real enum value', async () => {
    const get = jest.spyOn(apiClient, 'get').mockResolvedValue({ data: [] });
    await productApi.getProductsByCollection('DRINK', { page: 1, limit: 12, order: 'productViews' });
    expect(get).toHaveBeenCalledTimes(1);
    expect(get.mock.calls[0][1]?.params).toMatchObject({ productCollection: 'DRINK' });
  });

  it('queries both DESERT and DESSERT for desserts and merges the results (D2)', async () => {
    const get = jest.spyOn(apiClient, 'get').mockImplementation(async (_url, config) => {
      const value = (config?.params as { productCollection: string }).productCollection;
      return {
        data:
          value === 'DESERT'
            ? [product({ _id: 'a', productCollection: 'DESERT', productViews: 5 })]
            : [product({ _id: 'b', productCollection: 'DESSERT', productViews: 9 })],
      };
    });
    const page = await productApi.getProductsByCollection('DESERT', { page: 1, limit: 12, order: 'productViews' });
    expect(get.mock.calls.map((call) => (call[1]?.params as { productCollection: string }).productCollection)).toEqual([
      'DESERT',
      'DESSERT',
    ]);
    expect(page.items.map((item) => item._id)).toEqual(['b', 'a']);
    expect(page.hasMore).toBe(false);
  });

  it('reports more pages when a page came back full', async () => {
    jest.spyOn(apiClient, 'get').mockResolvedValue({ data: [product({ _id: '1' }), product({ _id: '2' })] });
    expect((await productApi.getProducts({ page: 1, limit: 2, order: 'createdAt' })).hasMore).toBe(true);
    expect((await productApi.getProducts({ page: 1, limit: 3, order: 'createdAt' })).hasMore).toBe(false);
  });

  it('rejects a non-array response instead of guessing', async () => {
    jest.spyOn(apiClient, 'get').mockResolvedValue({ data: { code: 500 } });
    await expect(productApi.getProducts({ page: 1, limit: 1, order: 'createdAt' })).rejects.toThrow(/unexpected product list/);
  });

  it('propagates API failures', async () => {
    jest.spyOn(apiClient, 'get').mockRejectedValue(new Error('boom'));
    await expect(productApi.getProducts({ page: 1, limit: 1, order: 'createdAt' })).rejects.toThrow('boom');
  });
});

describe('productApi.getProductById', () => {
  afterEach(() => jest.restoreAllMocks());

  it('requests GET /product/:id', async () => {
    const get = jest.spyOn(apiClient, 'get').mockResolvedValue({ data: product({ _id: '6aedacf4e41718924919d197' }) });
    await productApi.getProductById('6aedacf4e41718924919d197');
    expect(get).toHaveBeenCalledWith('/product/6aedacf4e41718924919d197', { signal: undefined });
  });

  it('rejects malformed ids locally (the backend would answer 500)', async () => {
    const get = jest.spyOn(apiClient, 'get');
    await expect(productApi.getProductById('../member/detail')).rejects.toMatchObject({ status: 404 });
    expect(get).not.toHaveBeenCalled();
  });
});

describe('product display helpers', () => {
  it('labels known, aliased and unexpected collections without hiding them', () => {
    expect(getCollectionLabel('DESERT')).toBe('Dessert');
    expect(getCollectionLabel('DESSERT')).toBe('Dessert');
    expect(getCollectionLabel('BREAKFAST')).toBe('Breakfast');
    expect(getCollectionIcon('BREAKFAST')).toBe('other');
  });

  it('shows volume for drinks and size for food', () => {
    expect(getPortionLabel(product({ productCollection: 'DRINK', productVolume: 1.5 }))).toBe('1.5 L');
    expect(getPortionLabel(product({ productSize: 'LARGE' }))).toBe('Large');
  });

  it('derives stock state from productLeftCount', () => {
    expect(getStockState({ productLeftCount: 0 })).toEqual({ kind: 'soldOut' });
    expect(getStockState({ productLeftCount: 3 })).toEqual({ kind: 'low', left: 3 });
    expect(getStockState({ productLeftCount: 20 })).toEqual({ kind: 'available' });
  });

  it('merges pages without duplicates, honouring the backend sort direction', () => {
    const cheap = product({ _id: 'cheap', productPrice: 4000 });
    const pricey = product({ _id: 'pricey', productPrice: 25000 });
    expect(mergeProductPages([[pricey], [cheap, pricey]], 'productPrice').map((p) => p._id)).toEqual(['cheap', 'pricey']);
    const older = product({ _id: 'old', createdAt: { $date: '2026-10-01T00:00:00.000Z' } });
    const newer = product({ _id: 'new', createdAt: '2026-11-05T00:00:00.000Z' });
    expect(mergeProductPages([[older], [newer]], 'createdAt').map((p) => p._id)).toEqual(['new', 'old']);
  });
});
