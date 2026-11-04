import AsyncStorage from '@react-native-async-storage/async-storage';

import { categories } from '@/data/categories';
import { defaultCustomer } from '@/data/customer';
import { initialOrders } from '@/data/orders';
import { products } from '@/data/products';
import { restaurant } from '@/data/restaurant';
import type { Customer, Order, Product, ProductCategoryItem } from '@/types/models';

const CART_KEY = 'burak.customer.cart.v1';
const ORDERS_KEY = 'burak.customer.orders.v1';
const CUSTOMER_KEY = 'burak.customer.profile.v1';

const pause = () => new Promise((resolve) => setTimeout(resolve, 80));

/** Async mock interfaces keep screens independent from the current data source. */
export const catalogService = {
  async getProducts(): Promise<Product[]> {
    await pause();
    return products;
  },
  async getCategories(): Promise<ProductCategoryItem[]> {
    await pause();
    return categories;
  },
  async getRestaurant() {
    await pause();
    return restaurant;
  },
};

export const customerService = {
  async getProfile(): Promise<Customer> {
    try {
      const saved = await AsyncStorage.getItem(CUSTOMER_KEY);
      return saved ? { ...defaultCustomer, ...JSON.parse(saved) as Partial<Customer> } : defaultCustomer;
    } catch {
      return defaultCustomer;
    }
  },
  async saveProfile(customer: Customer): Promise<void> {
    await AsyncStorage.setItem(CUSTOMER_KEY, JSON.stringify(customer));
  },
};

export const cartStorage = {
  async load(): Promise<{ productId: string; quantity: number; extraIds: string[] }[]> {
    try {
      const saved = await AsyncStorage.getItem(CART_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  },
  async save(value: { productId: string; quantity: number; extraIds: string[] }[]): Promise<void> {
    await AsyncStorage.setItem(CART_KEY, JSON.stringify(value));
  },
};

export const orderService = {
  async getOrders(): Promise<Order[]> {
    try {
      const saved = await AsyncStorage.getItem(ORDERS_KEY);
      return saved ? JSON.parse(saved) : initialOrders;
    } catch {
      return initialOrders;
    }
  },
  async saveOrders(value: Order[]): Promise<void> {
    await AsyncStorage.setItem(ORDERS_KEY, JSON.stringify(value));
  },
};
