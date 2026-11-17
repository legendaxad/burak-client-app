import { useInfiniteQuery, useQuery, useQueryClient, type InfiniteData, type QueryClient } from '@tanstack/react-query';

import { productKeys, type ProductListFilters } from '../query-keys';
import { productApi } from '../services/product-api';
import type { Product, ProductPage, ProductSort } from '../types';

export const PRODUCT_PAGE_SIZE = 12;

/** Infinite, filterable product list (menu screen). */
export function useProductList(filters: ProductListFilters) {
  return useInfiniteQuery({
    queryKey: productKeys.list(filters),
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      productApi.getProducts({ ...filters, page: pageParam, limit: PRODUCT_PAGE_SIZE }, signal),
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
  });
}

/** First page of a sort order, for home screen sections. */
export function useProductSection(order: ProductSort, limit = 8) {
  return useQuery({
    queryKey: productKeys.section(order, limit),
    queryFn: ({ signal }) => productApi.getProducts({ order, page: 1, limit }, signal),
    select: (page) => page.items,
  });
}

function isProductPage(value: unknown): value is ProductPage {
  return typeof value === 'object' && value !== null && Array.isArray((value as ProductPage).items);
}

function isInfiniteProductData(value: unknown): value is InfiniteData<ProductPage> {
  return typeof value === 'object' && value !== null && Array.isArray((value as InfiniteData<unknown>).pages);
}

/** Looks through cached lists and sections (never the network) for a product. */
export function findCachedProduct(queryClient: QueryClient, id: string): Product | undefined {
  for (const query of queryClient.getQueryCache().findAll({ queryKey: productKeys.all })) {
    const data: unknown = query.state.data;
    const pages = isInfiniteProductData(data) ? data.pages : isProductPage(data) ? [data] : [];
    for (const page of pages) {
      const hit = page.items.find((product) => product._id === id);
      if (hit) return hit;
    }
  }
  return undefined;
}

/**
 * Product detail. A product already seen in a list is shown instantly as placeholder
 * data while the real detail request runs (that request records the member's view).
 */
export function useProduct(id: string) {
  const queryClient = useQueryClient();
  return useQuery<Product>({
    queryKey: productKeys.detail(id),
    queryFn: ({ signal }) => productApi.getProductById(id, signal),
    placeholderData: () => findCachedProduct(queryClient, id),
  });
}
