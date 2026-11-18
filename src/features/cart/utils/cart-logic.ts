/**
 * Pure cart operations. The cart stores only WHAT was selected (productId, quantity);
 * prices, availability and stock always come from the server.
 */

export interface CartItem {
  productId: string;
  quantity: number;
}

/** UI cap per line, in addition to the product's live stock. */
export const MAX_LINE_QUANTITY = 99;

/** Highest quantity allowed for a line, given live stock (when known). */
export function maxQuantityFor(stock?: number): number {
  if (stock === undefined || !Number.isFinite(stock)) return MAX_LINE_QUANTITY;
  return Math.max(0, Math.min(Math.floor(stock), MAX_LINE_QUANTITY));
}

/** Clamps to an integer in [1, max]. Returns 0 when nothing can be added (max ≤ 0). */
export function clampQuantity(quantity: number, max: number = MAX_LINE_QUANTITY): number {
  const ceiling = Math.min(max, MAX_LINE_QUANTITY);
  if (ceiling <= 0 || !Number.isFinite(quantity)) return 0;
  return Math.min(Math.max(1, Math.floor(quantity)), ceiling);
}

/** Adds to an existing line (never a duplicate line), respecting stock. */
export function addItem(items: CartItem[], productId: string, quantity: number, stock?: number): CartItem[] {
  const max = maxQuantityFor(stock);
  const existing = items.find((item) => item.productId === productId);
  const next = clampQuantity((existing?.quantity ?? 0) + quantity, max);
  if (next === 0) return items;
  if (existing) {
    return items.map((item) => (item.productId === productId ? { ...item, quantity: next } : item));
  }
  return [...items, { productId, quantity: next }];
}

/** Sets a line's quantity. Zero or less removes the line. */
export function setItemQuantity(items: CartItem[], productId: string, quantity: number, stock?: number): CartItem[] {
  if (!items.some((item) => item.productId === productId)) return items;
  if (quantity <= 0) return removeItems(items, [productId]);
  const next = clampQuantity(quantity, maxQuantityFor(stock));
  if (next === 0) return removeItems(items, [productId]);
  return items.map((item) => (item.productId === productId ? { ...item, quantity: next } : item));
}

export function removeItems(items: CartItem[], productIds: readonly string[]): CartItem[] {
  const remove = new Set(productIds);
  return items.filter((item) => !remove.has(item.productId));
}

export function countItems(items: readonly CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

/** Validates persisted data on rehydration: drops malformed lines and merges duplicates. */
export function sanitizeCartItems(raw: unknown): CartItem[] {
  if (!Array.isArray(raw)) return [];
  let items: CartItem[] = [];
  for (const entry of raw) {
    if (typeof entry !== 'object' || entry === null) continue;
    const { productId, quantity } = entry as Record<string, unknown>;
    if (typeof productId !== 'string' || !productId || typeof quantity !== 'number') continue;
    items = addItem(items, productId, quantity);
  }
  return items;
}
