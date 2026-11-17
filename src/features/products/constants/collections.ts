import type { IconName } from '@/components/common/icon';

import type { ProductCollection, ProductSort } from '../types';

export interface CollectionFilter {
  key: ProductCollection;
  label: string;
  singular: string;
  icon: IconName;
  /**
   * Values queried on the backend for this filter. Desserts also query "DESSERT"
   * because existing records were stored with that spelling (data issue D2), while
   * the schema enum is "DESERT". Remove the alias once the data is corrected.
   */
  backendValues: readonly string[];
}

export const COLLECTION_FILTERS: readonly CollectionFilter[] = [
  { key: 'DISH', label: 'Dishes', singular: 'Dish', icon: 'dish', backendValues: ['DISH'] },
  { key: 'SALAD', label: 'Salads', singular: 'Salad', icon: 'salad', backendValues: ['SALAD'] },
  { key: 'DESERT', label: 'Desserts', singular: 'Dessert', icon: 'dessert', backendValues: ['DESERT', 'DESSERT'] },
  { key: 'DRINK', label: 'Drinks', singular: 'Drink', icon: 'drink', backendValues: ['DRINK'] },
  { key: 'OTHER', label: 'Other', singular: 'Other', icon: 'other', backendValues: ['OTHER'] },
];

export function findCollectionFilter(key: string | undefined): CollectionFilter | undefined {
  return key ? COLLECTION_FILTERS.find((filter) => filter.key === key) : undefined;
}

/** Display label for any stored value, including unexpected ones (never hidden). */
export function getCollectionLabel(value: string): string {
  const match = COLLECTION_FILTERS.find((filter) => filter.backendValues.includes(value));
  if (match) return match.singular;
  const cleaned = value.trim().toLowerCase();
  return cleaned ? cleaned.charAt(0).toUpperCase() + cleaned.slice(1) : 'Menu item';
}

export function getCollectionIcon(value: string): IconName {
  return COLLECTION_FILTERS.find((filter) => filter.backendValues.includes(value))?.icon ?? 'other';
}

export const SORT_OPTIONS: readonly { key: ProductSort; label: string }[] = [
  { key: 'productViews', label: 'Popular' },
  { key: 'createdAt', label: 'Newest' },
  { key: 'productPrice', label: 'Lowest price' },
];
