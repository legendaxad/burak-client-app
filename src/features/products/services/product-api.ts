import { ApiError, apiClient, endpoints } from '@/services/api';
import { escapeRegex } from '@/utils/escape-regex';

import { findCollectionFilter } from '../constants/collections';
import type { Product, ProductCollection, ProductListParams, ProductPage } from '../types';
import { mergeProductPages } from '../utils/product-sorting';

const OBJECT_ID = /^[a-f0-9]{24}$/i;

interface RawQuery {
  page: number;
  limit: number;
  order: string;
  productCollection?: string;
  search?: string;
}

/** One call to GET /product/all. `page`, `limit` and `order` are always sent (B11). */
async function fetchRawPage(query: RawQuery, signal?: AbortSignal): Promise<Product[]> {
  const { data } = await apiClient.get<unknown>(endpoints.product.all, { params: query, signal });
  if (!Array.isArray(data)) {
    throw new ApiError('unknown', 'The server returned an unexpected product list.');
  }
  return data as Product[];
}

export const productApi = {
  /**
   * Lists products. When a filter maps to several stored values (desserts, D2) it
   * fetches the same page for each value and merges them. Every product is still
   * returned exactly once across pages; only the order at page boundaries may differ
   * slightly from a single backend sort.
   */
  async getProducts(params: ProductListParams, signal?: AbortSignal): Promise<ProductPage> {
    const search = params.search?.trim();
    const base = {
      page: params.page,
      limit: params.limit,
      order: params.order,
      ...(search ? { search: escapeRegex(search) } : {}),
    };

    const filter = findCollectionFilter(params.collection);
    const collectionValues: (string | undefined)[] = filter ? [...filter.backendValues] : [undefined];

    const pages = await Promise.all(
      collectionValues.map((value) =>
        fetchRawPage(value ? { ...base, productCollection: value } : base, signal),
      ),
    );

    return {
      items: pages.length === 1 ? pages[0] : mergeProductPages(pages, params.order),
      page: params.page,
      hasMore: pages.some((page) => page.length === params.limit),
    };
  },

  searchProducts(term: string, params: Omit<ProductListParams, 'search'>, signal?: AbortSignal) {
    return productApi.getProducts({ ...params, search: term }, signal);
  },

  getProductsByCollection(
    collection: ProductCollection,
    params: Omit<ProductListParams, 'collection'>,
    signal?: AbortSignal,
  ) {
    return productApi.getProducts({ ...params, collection }, signal);
  },

  /**
   * GET /product/:id. With a Bearer token the backend records a first view
   * for this member and increments `productViews`.
   */
  async getProductById(id: string, signal?: AbortSignal): Promise<Product> {
    // A malformed id makes the backend throw a BSON error and answer 500, so reject it locally.
    if (!OBJECT_ID.test(id)) {
      throw new ApiError('http', 'This product could not be found.', { status: 404 });
    }
    const { data } = await apiClient.get<Product>(endpoints.product.byId(id), { signal });
    return data;
  },
};
