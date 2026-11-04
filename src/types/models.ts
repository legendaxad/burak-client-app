import type { ImageSourcePropType } from 'react-native';

export type ProductCategory = 'Grill' | 'Mains' | 'Soup' | 'Pasta' | 'Rice' | 'Dessert';
export type OrderStatus = 'Pending' | 'Preparing' | 'Ready' | 'Completed' | 'Cancelled';
export type PaymentMethod = 'Cash on delivery' | 'Card on delivery';

export interface ProductExtra {
  id: string;
  name: string;
  price: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: ProductCategory;
  price: number;
  image: ImageSourcePropType;
  availability: 'Available' | 'Sold out';
  rating: number;
  prepMinutes: number;
  extras: ProductExtra[];
  isPopular?: boolean;
  isRecommended?: boolean;
  isBestSeller?: boolean;
}

export interface CartLine {
  id: string;
  product: Product;
  quantity: number;
  extras: ProductExtra[];
}

export interface Customer {
  name: string;
  phone: string;
  email: string;
  address: string;
  instructions: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  image: ImageSourcePropType;
  quantity: number;
  unitPrice: number;
  extras: string[];
}

export interface Order {
  id: string;
  createdAt: string;
  status: OrderStatus;
  eta: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod: PaymentMethod;
  customer: Pick<Customer, 'name' | 'phone' | 'address' | 'instructions'>;
}

export interface Restaurant {
  name: string;
  tagline: string;
  rating: number;
  reviewCount: number;
  deliveryTime: string;
  hours: string;
  address: string;
  deliveryFee: number;
  freeDeliveryMinimum: number;
}

export interface ProductCategoryItem {
  id: ProductCategory;
  name: ProductCategory;
  icon: string;
}
