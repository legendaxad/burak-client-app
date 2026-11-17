import type { BackendDate } from '@/types/api';

/** Enum values from `src/libs/enums/product.enum.ts`. Note "DESERT" (sic) is the real value. */
export type ProductCollection = 'DISH' | 'SALAD' | 'DESERT' | 'DRINK' | 'OTHER';
export type ProductSize = 'SMALL' | 'NORMAL' | 'LARGE' | 'SET';
export type ProductStatus = 'PAUSE' | 'PROCESS' | 'DELETE';

/** Mirrors the backend Product document as returned by /product/all and /product/:id. */
export interface Product {
  _id: string;
  productStatus: ProductStatus;
  /** Typed as string too: live data contains "DESSERT", outside the enum (data issue D2). */
  productCollection: ProductCollection | (string & {});
  productName: string;
  productPrice: number;
  productLeftCount: number;
  productSize: ProductSize;
  /** Litres; meaningful for drinks. */
  productVolume: number;
  productDesc?: string;
  /** Relative upload paths. Often empty in the current database (data issue D3). */
  productImages: string[];
  productViews: number;
  createdAt: BackendDate;
  updatedAt: BackendDate;
}

/**
 * Values of the `order` query parameter that produce a meaningful sort.
 * The backend sorts `productPrice` ascending and everything else descending.
 */
export type ProductSort = 'productViews' | 'createdAt' | 'productPrice';

export interface ProductListParams {
  page: number;
  limit: number;
  order: ProductSort;
  collection?: ProductCollection;
  search?: string;
}

export interface ProductPage {
  items: Product[];
  page: number;
  /** The API has no total count: there may be more when a page came back full. */
  hasMore: boolean;
}
