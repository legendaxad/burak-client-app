import type { ProductCollection, ProductSort } from './types';

export interface ProductListFilters {
  order: ProductSort;
  collection?: ProductCollection;
  search?: string;
}

export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (filters: ProductListFilters) => [...productKeys.lists(), filters] as const,
  sections: () => [...productKeys.all, 'section'] as const,
  section: (order: ProductSort, limit: number) => [...productKeys.sections(), order, limit] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
};
