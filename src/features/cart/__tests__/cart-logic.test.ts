import AsyncStorage from '@react-native-async-storage/async-storage';

import { CART_STORAGE_KEY, selectCartCount, useCartStore } from '@/store/cart/cart-store';

import {
  addItem,
  clampQuantity,
  countItems,
  MAX_LINE_QUANTITY,
  maxQuantityFor,
  sanitizeCartItems,
  setItemQuantity,
} from '../utils/cart-logic';

describe('cart logic', () => {
  it('merges repeated adds into one line (no duplicates)', () => {
    let items = addItem([], 'a', 2);
    items = addItem(items, 'a', 3);
    expect(items).toEqual([{ productId: 'a', quantity: 5 }]);
  });

  it('never exceeds live stock or the per-line cap', () => {
    expect(addItem([], 'a', 10, 4)).toEqual([{ productId: 'a', quantity: 4 }]);
    expect(addItem([{ productId: 'a', quantity: 4 }], 'a', 1, 4)).toEqual([{ productId: 'a', quantity: 4 }]);
    expect(addItem([], 'a', 500)).toEqual([{ productId: 'a', quantity: MAX_LINE_QUANTITY }]);
  });

  it('refuses to add sold-out products', () => {
    expect(addItem([], 'a', 1, 0)).toEqual([]);
  });

  it('rejects zero, negative and fractional quantities', () => {
    expect(clampQuantity(0)).toBe(1);
    expect(clampQuantity(2.7)).toBe(2);
    expect(clampQuantity(Number.NaN)).toBe(0);
    expect(clampQuantity(3, 0)).toBe(0);
    expect(maxQuantityFor(-2)).toBe(0);
  });

  it('removes a line when its quantity is set to zero', () => {
    const items = [{ productId: 'a', quantity: 2 }, { productId: 'b', quantity: 1 }];
    expect(setItemQuantity(items, 'a', 0)).toEqual([{ productId: 'b', quantity: 1 }]);
    expect(setItemQuantity(items, 'a', 9, 3)).toEqual([{ productId: 'a', quantity: 3 }, { productId: 'b', quantity: 1 }]);
    expect(setItemQuantity(items, 'zzz', 4)).toBe(items);
  });

  it('counts units', () => {
    expect(countItems([{ productId: 'a', quantity: 2 }, { productId: 'b', quantity: 3 }])).toBe(5);
  });

  it('sanitizes persisted data: drops garbage, merges duplicates, fixes quantities', () => {
    expect(
      sanitizeCartItems([
        { productId: 'a', quantity: 2 },
        { productId: 'a', quantity: 1 },
        { productId: 'b', quantity: -4 },
        { productId: 42, quantity: 1 },
        null,
        'x',
      ]),
    ).toEqual([
      { productId: 'a', quantity: 3 },
      { productId: 'b', quantity: 1 },
    ]);
    expect(sanitizeCartItems('corrupted')).toEqual([]);
  });
});

describe('cart store', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    useCartStore.setState({ ownerId: null, items: [] });
  });

  it('persists only ids and quantities (no prices) to AsyncStorage', async () => {
    useCartStore.getState().add('p1', 2, 10);
    await new Promise((resolve) => setTimeout(resolve, 0));
    const saved = JSON.parse((await AsyncStorage.getItem(CART_STORAGE_KEY)) ?? '{}');
    expect(saved.state).toEqual({ ownerId: null, items: [{ productId: 'p1', quantity: 2 }] });
  });

  it('restores the cart after an app restart', async () => {
    // Fresh process: in-memory state empty (setState also persists, so do it first)…
    useCartStore.setState({ ownerId: null, items: [], hasHydrated: false });
    // …while the device still holds the cart saved by the previous run.
    await AsyncStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify({ state: { ownerId: 'm1', items: [{ productId: 'p1', quantity: 3 }] }, version: 1 }),
    );
    await useCartStore.persist.rehydrate();
    expect(useCartStore.getState()).toMatchObject({
      ownerId: 'm1',
      items: [{ productId: 'p1', quantity: 3 }],
      hasHydrated: true,
    });
  });

  it('survives corrupted storage', async () => {
    await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ state: { items: 'nope' }, version: 1 }));
    await useCartStore.persist.rehydrate();
    expect(useCartStore.getState().items).toEqual([]);
  });

  it('supports add, set, remove, removeMany, clear and the badge count', () => {
    const cart = useCartStore.getState();
    cart.add('a', 1);
    cart.add('b', 2);
    cart.add('c', 1);
    cart.setQuantity('a', 4);
    expect(selectCartCount(useCartStore.getState())).toBe(7);
    cart.remove('c');
    cart.removeMany(['a']);
    expect(useCartStore.getState().items).toEqual([{ productId: 'b', quantity: 2 }]);
    cart.clear();
    expect(useCartStore.getState().items).toEqual([]);
  });

  it('keeps the cart for the same member and empties it for another member', () => {
    useCartStore.setState({ ownerId: 'm1', items: [{ productId: 'a', quantity: 1 }] });
    useCartStore.getState().bindOwner('m1');
    expect(useCartStore.getState().items).toHaveLength(1);
    useCartStore.getState().bindOwner('m2');
    expect(useCartStore.getState()).toMatchObject({ ownerId: 'm2', items: [] });
  });
});
