import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  addItem,
  countItems,
  removeItems,
  sanitizeCartItems,
  setItemQuantity,
  type CartItem,
} from '@/features/cart/utils/cart-logic';

/**
 * Client-side cart. Persisted to AsyncStorage (non-sensitive: ids and quantities only).
 * `ownerId` ties the saved cart to the member who built it, so a different account
 * signing in on the same device never sees it.
 */
interface CartState {
  ownerId: string | null;
  items: CartItem[];
  hasHydrated: boolean;
  add: (productId: string, quantity: number, stock?: number) => void;
  setQuantity: (productId: string, quantity: number, stock?: number) => void;
  remove: (productId: string) => void;
  removeMany: (productIds: readonly string[]) => void;
  clear: () => void;
  /** Called on sign-in: keeps the cart for the same member, empties it for anyone else. */
  bindOwner: (memberId: string) => void;
}

export const CART_STORAGE_KEY = 'burak.cart.v1';

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      ownerId: null,
      items: [],
      hasHydrated: false,
      add: (productId, quantity, stock) => set((state) => ({ items: addItem(state.items, productId, quantity, stock) })),
      setQuantity: (productId, quantity, stock) =>
        set((state) => ({ items: setItemQuantity(state.items, productId, quantity, stock) })),
      remove: (productId) => set((state) => ({ items: removeItems(state.items, [productId]) })),
      removeMany: (productIds) => set((state) => ({ items: removeItems(state.items, productIds) })),
      clear: () => set({ items: [] }),
      bindOwner: (memberId) =>
        set((state) => (state.ownerId === memberId ? state : { ownerId: memberId, items: [] })),
    }),
    {
      name: CART_STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ ownerId: state.ownerId, items: state.items }),
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<Pick<CartState, 'ownerId' | 'items'>>;
        return {
          ...current,
          ownerId: typeof saved.ownerId === 'string' ? saved.ownerId : null,
          items: sanitizeCartItems(saved.items),
        };
      },
      onRehydrateStorage: () => () => {
        useCartStore.setState({ hasHydrated: true });
      },
    },
  ),
);

/** Total number of units, for badges. */
export const selectCartCount = (state: CartState) => countItems(state.items);
