import type { Product } from '@/features/products/types';
import type { BackendDate } from '@/types/api';

/** `src/libs/enums/order.enum.ts` in the backend. */
export type OrderStatus = 'PAUSE' | 'PROCESS' | 'FINISH' | 'DELETED';

/** Order document as returned by POST /order/create and POST /order/update. */
export interface Order {
  _id: string;
  memberId: string;
  /** Items total + delivery, computed by the backend. */
  orderTotal: number;
  orderDelivery: number;
  orderStatus: OrderStatus;
  createdAt: BackendDate;
  updatedAt: BackendDate;
}

export interface OrderItem {
  _id: string;
  orderId: string;
  productId: string;
  itemQuantity: number;
  /** Unit price recorded when the order was created. */
  itemPrice: number;
  createdAt: BackendDate;
  updatedAt: BackendDate;
}

/** Element of GET /order/all (aggregation with two $lookup stages). */
export interface OrderWithItems extends Order {
  orderItems: OrderItem[];
  /** Products referenced by orderItems that still exist (any status). */
  productData: Product[];
}

export interface OrderPage {
  items: OrderWithItems[];
  page: number;
  hasMore: boolean;
}
